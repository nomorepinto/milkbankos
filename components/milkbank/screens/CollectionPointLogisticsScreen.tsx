"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { LogisticsSubNav } from "@/components/milkbank/layout/LogisticsSubNav";
import { Icon } from "@/components/milkbank/ui/Icon";
import { supabase } from "@/lib/supabaseClient";

declare const google: any;

export interface MapPoint {
  id: string;
  name: string;
  type: "hospital" | "shipping";
  status: "active" | "busy" | "idle";
  capacity?: string;
  departure?: string;
  expiry?: string;
  latitude: number;
  longitude: number;
}

export interface CollectionPointLogisticsScreenProps { }

export function CollectionPointLogisticsScreen(_props: Readonly<CollectionPointLogisticsScreenProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFixedCenters, setShowFixedCenters] = useState(true);
  const [showMobileHubs, setShowMobileHubs] = useState(true);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  const [points, setPoints] = useState<MapPoint[]>([]);
  const [stats, setStats] = useState({
    activeHubs: "00",
    todayIntake: "0.0 L",
    liveDonors: "0",
  });

  // Google Maps State
  const [map, setMap] = useState<any>(null);
  const [pinPositions, setPinPositions] = useState<Record<string, { top: string; left: string; visible: boolean }>>({});

  // Add Hospital Modal State
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [region, setRegion] = useState("");
  const [area, setArea] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleLocateAddress = async () => {
    if (!address.trim()) {
      setGeocodingError("Please enter an address first.");
      return;
    }
    setIsGeocoding(true);
    setGeocodingError("");
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setGeocodingError(data.error || "Geocoding failed.");
        setLatitude(null);
        setLongitude(null);
      } else {
        setLatitude(data.lat);
        setLongitude(data.lng);
        const components = data.addressComponents || [];
        
        let foundArea = "";
        let foundRegion = "";
        
        for (const comp of components) {
          if (comp.types.includes("neighborhood") || comp.types.includes("sublocality") || comp.types.includes("locality")) {
            foundArea = comp.long_name;
          }
          if (comp.types.includes("administrative_area_level_1")) {
            foundRegion = comp.long_name;
          }
        }
        
        setArea(foundArea || "SOMA");
        setRegion(foundRegion || "Metropolitan North");
      }
    } catch (err: any) {
      setGeocodingError(err.message || "An error occurred while geocoding.");
      setLatitude(null);
      setLongitude(null);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSaveHospital = async () => {
    if (!hospitalName.trim() || !contactNumber.trim() || latitude === null || longitude === null) {
      alert("Please fill all fields and locate the address first.");
      return;
    }
    setIsSaving(true);
    try {
      const generatedEmail = `hosp_${hospitalName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now()}@hospital.milkbank.org`;
      
      // 1. Insert user
      const { data: newUser, error: userErr } = await supabase
        .from("users")
        .insert({
          email: generatedEmail,
          encrypted_password: "hospitalpassword123",
          role: "donor",
          is_active: true
        })
        .select("id")
        .single();

      if (userErr) {
        alert("Failed to register hospital user: " + userErr.message);
        return;
      }

      // 2. Insert profile as type="hospital"
      const displayId = "HOSP-" + Math.floor(1000 + Math.random() * 9000);
      const { error: profileErr } = await supabase
        .from("donor_profiles")
        .insert({
          id: newUser.id,
          display_id: displayId,
          full_name: hospitalName,
          status: "verified",
          status_label: "Active",
          screening_due: false,
          contact_phone: contactNumber,
          donation_cycles: 0,
          verification_note: "Verified Hospital",
          region: region || "Metropolitan North",
          area: area || "Mission District",
          latitude: latitude,
          longitude: longitude,
          type: "hospital"
        });

      if (profileErr) {
        alert("Failed to save hospital profile: " + profileErr.message);
        return;
      }

      alert("Hospital registered successfully as collection point!");
      setHospitalName("");
      setContactNumber("");
      setAddress("");
      setLatitude(null);
      setLongitude(null);
      setArea("");
      setRegion("");
      setGeocodingError("");
      setShowAddModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      alert("An error occurred: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    async function loadLogisticsData() {
      // 1. Fetch points
      const { data: dbPoints } = await supabase
        .from("donor_profiles")
        .select("*")
        .eq("type", "hospital");

      if (dbPoints) {
        setPoints(dbPoints
          .filter(p => p.latitude !== null && p.longitude !== null)
          .map(p => {
            return {
              id: p.display_id,
              name: p.full_name,
              type: p.type as "hospital",
              status: p.status === "verified" ? "active" : p.status === "fail" ? "busy" : "idle",
              capacity: p.capacity_percentage ? `${p.capacity_percentage}% filled` : undefined,
              departure: p.departure_time ? p.departure_time.substring(0, 5) : undefined,
              expiry: p.expiry_interval ? p.expiry_interval : undefined,
              latitude: Number(p.latitude),
              longitude: Number(p.longitude)
            };
          })
        );
      }

      // 2. Fetch stats
      const { data: dbStats } = await supabase
        .from("view_logistics_stats")
        .select("*")
        .single();

      if (dbStats) {
        setStats({
          activeHubs: String(dbStats.active_hubs).padStart(2, '0'),
          todayIntake: `${(dbStats.today_intake_ml / 1000).toFixed(1)} L`,
          liveDonors: String(dbStats.live_donors)
        });
      }
    }

    loadLogisticsData();
  }, [refreshTrigger]);

  // Initialize Google Maps
  useEffect(() => {
    let active = true;
    async function initGoogleMaps() {
      try {
        const res = await fetch("/api/maps-key");
        const { apiKey } = await res.json();
        if (!apiKey || !active) return;

        if (!(window as any).google) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            if (active) setupMap();
          };
          document.head.appendChild(script);
        } else {
          setupMap();
        }
      } catch (err) {
        console.error("Failed to load maps key", err);
      }
    }

    function setupMap() {
      const mapContainer = document.getElementById("google-map-bg");
      if (!mapContainer || !(window as any).google) return;
      const gMap = new google.maps.Map(mapContainer, {
        center: { lat: 37.765, lng: -122.42 }, // Focus around San Francisco (Mission/Castro/SOMA area)
        zoom: 13,
        disableDefaultUI: true,
        styles: [
          {
            stylers: [{ saturation: -100 }]
          },
          {
            featureType: "poi",
            elementType: "all",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "transit",
            elementType: "all",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry.fill",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#e0e0e0" }]
          },
          {
            featureType: "water",
            elementType: "geometry.fill",
            stylers: [{ color: "#d2d2d2" }]
          },
          {
            featureType: "landscape",
            elementType: "geometry.fill",
            stylers: [{ color: "#f7f7f7" }]
          }
        ]
      });
      setMap(gMap);
    }

    initGoogleMaps();
    return () => {
      active = false;
    };
  }, []);

  // Auto-center map to the first entry fetched's coordinates
  useEffect(() => {
    if (!map || points.length === 0) return;

    if (points[0]) {
      map.setCenter({ lat: points[0].latitude, lng: points[0].longitude });
    }
  }, [map, points]);

  // Track map projection to synchronize React HTML pins with map lat/lng coordinates
  useEffect(() => {
    if (!map || points.length === 0) return;

    const overlay = new google.maps.OverlayView();
    overlay.onAdd = () => { };
    overlay.onRemove = () => { };
    overlay.draw = () => {
      const projection = overlay.getProjection();
      if (!projection) return;

      const newPositions: Record<string, { top: string; left: string; visible: boolean }> = {};
      points.forEach(point => {
        const latLng = new google.maps.LatLng(point.latitude, point.longitude);
        const pos = projection.fromLatLngToContainerPixel(latLng);
        if (pos) {
          newPositions[point.id] = {
            top: `${pos.y}px`,
            left: `${pos.x}px`,
            visible: true
          };
        } else {
          newPositions[point.id] = {
            top: "0px",
            left: "0px",
            visible: false
          };
        }
      });
      setPinPositions(newPositions);
    };

    overlay.setMap(map);

    // Trigger initial projection update when map is idle
    const idleListener = map.addListener("idle", () => {
      overlay.draw();
    });

    return () => {
      overlay.setMap(null);
      google.maps.event.removeListener(idleListener);
    };
  }, [map, points]);

  const filteredPoints = points.filter((point) => {
    // Search filter
    const matchesSearch =
      point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    if (point.type === "hospital" && !showFixedCenters) return false;
    if (point.type === "shipping" && !showMobileHubs) return false;

    return matchesSearch;
  });

  return (
    <AppShell activeSlug="collection-point-logistics" fullBleed>
      <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
        <LogisticsSubNav activeTab="map" />

        {/* Map Area */}
        <div className="relative flex-1 bg-surface-container-low overflow-hidden">

          {/* Real Google Map Background */}
          <div id="google-map-bg" className="absolute inset-0 z-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/90 via-transparent to-transparent pointer-events-none h-[15%] z-10" />

          {/* Sibling overlay for custom interactive React pins */}
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden h-full w-full">
            {filteredPoints.map((point) => {
              const pos = pinPositions[point.id];
              if (!pos || !pos.visible) return null;

              const isOpened = activePointId === point.id || hoveredPointId === point.id;
              const isHospital = point.type === "hospital";

              const markerBgClass = isHospital
                ? "bg-primary text-white"
                : "bg-secondary text-white";

              const markerIcon = isHospital ? "local_hospital" : "local_shipping";

              return (
                <div
                  key={point.id}
                  style={{
                    top: pos.top,
                    left: pos.left,
                    transform: "translate(-50%, -50%)" // Anchor exact center for round nodes
                  }}
                  className="absolute pointer-events-auto"
                  onMouseEnter={() => setHoveredPointId(point.id)}
                  onMouseLeave={() => setHoveredPointId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePointId(activePointId === point.id ? null : point.id);
                  }}
                >
                  <div className="relative cursor-pointer">
                    {isHospital && (
                      <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping opacity-75 pointer-events-none" />
                    )}

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white relative z-10 transition-transform hover:scale-115 ${markerBgClass}`}>
                      <Icon name={markerIcon} filled className="text-xl" />
                    </div>

                    {/* Info Tooltip Card */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute bottom-12 left-1/2 -translate-x-1/2 w-64 rounded-xl bg-white/85 p-4 border border-slate-500/10 shadow-2xl backdrop-blur-md transition-all duration-300 ${isOpened ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${isHospital ? "bg-primary-container text-white" : "bg-secondary-fixed text-on-secondary-fixed"
                          }`}>
                          {isHospital ? "Fixed Center" : "Mobile Hub"}
                        </span>
                        {point.status === "busy" && (
                          <span className="text-error text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse"></span> BUSY
                          </span>
                        )}
                        {point.status === "active" && (
                          <span className="text-secondary text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span> ACTIVE
                          </span>
                        )}
                        {point.status === "idle" && (
                          <span className="text-on-surface-variant text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-outline rounded-full"></span> STANDBY
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-on-surface mb-1">{point.name}</h4>

                      {isHospital ? (
                        <div>
                          <p className="text-xs text-on-surface-variant leading-snug">
                            Primary reception center. Operational 24/7 for lab analysis.
                          </p>
                          <div className="mt-3 pt-2 border-t border-outline-variant/30 flex justify-end">
                            <Link
                              href={`/onsite-collection-terminal?hospitalId=${point.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                            >
                              <span>Open Collection Terminal</span>
                              <Icon name="arrow_forward" className="text-xs" />
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-on-surface-variant mb-3 leading-snug">
                            Current capacity: <span className="font-bold text-on-surface">{point.capacity}</span>. Scheduled departure: {point.departure}.
                          </p>
                          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/30">
                            <Icon name="schedule" className="text-primary text-sm" />
                            <span className="text-[11px] font-semibold text-on-surface-variant">
                              Expires in {point.expiry}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border border-slate-500/10 bg-white border-t-0 border-l-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overlays */}
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col h-full justify-between z-30">
            {/* Header & Search */}
            <div className="flex justify-between items-start pointer-events-auto w-full">
              <div className="bg-white/80 border border-slate-500/10 rounded-xl p-4 w-96 shadow-md backdrop-blur-md">
                <h1 className="text-xl font-bold text-on-surface mb-1">Collection Points Map</h1>
                <p className="text-xs text-on-surface-variant mb-4 font-semibold">
                  Tracking {filteredPoints.length} collection points across the region.
                </p>
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Search by district, name, or unit ID..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-lg hover:bg-primary/95 active:scale-95 transition-all cursor-pointer pointer-events-auto"
              >
                <Icon name="add_location_alt" />
                <span className="text-sm">Add New Collection Point</span>
              </button>
            </div>

            {/* Bottom Left Controls: Legend & Stats */}
            <div className="flex flex-wrap gap-4 mt-auto pointer-events-auto items-end">

              {/* Legend */}
              <div className="bg-white/80 border border-slate-500/10 rounded-xl p-4 space-y-3 shadow-md backdrop-blur-md w-64">
                <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                  Filter Legend
                </h5>
                <label className="flex items-center justify-between group cursor-pointer text-xs font-semibold text-on-surface">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center">
                      <Icon name="local_hospital" className="text-lg" />
                    </div>
                    <span>Fixed Centers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showFixedCenters}
                    onChange={(e) => setShowFixedCenters(e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between group cursor-pointer text-xs font-semibold text-on-surface">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary text-white rounded-lg flex items-center justify-center">
                      <Icon name="local_shipping" className="text-lg" />
                    </div>
                    <span>Mobile Hubs</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showMobileHubs}
                    onChange={(e) => setShowMobileHubs(e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                  />
                </label>
              </div>

              {/* Stats Overview */}
              <div className="bg-white/80 border border-slate-500/10 rounded-xl p-4 flex gap-8 shadow-md backdrop-blur-md font-bold">
                <div className="border-r border-outline-variant/35 pr-8">
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Active Hubs</p>
                  <p className="text-2xl text-primary font-bold">{stats.activeHubs}</p>
                </div>
                <div className="border-r border-outline-variant/35 pr-8">
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Today&apos;s Intake</p>
                  <p className="text-2xl text-secondary font-bold">{stats.todayIntake}</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Live Donors</p>
                  <p className="text-2xl text-tertiary font-bold">{stats.liveDonors}</p>
                </div>
              </div>

            </div>

          </div>

          {/* Floating Map Zoom Actions */}
          <div className="absolute right-6 top-24 flex flex-col gap-2 z-30 pointer-events-auto">
            <button
              type="button"
              onClick={() => map && map.setZoom(map.getZoom() + 1)}
              className="w-12 h-12 bg-white border border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant shadow-md hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="add" />
            </button>
            <button
              type="button"
              onClick={() => map && map.setZoom(map.getZoom() - 1)}
              className="w-12 h-12 bg-white border border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant shadow-md hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="remove" />
            </button>
            <button
              type="button"
              onClick={() => map && map.panTo({ lat: 37.765, lng: -122.42 })}
              className="w-12 h-12 bg-white border border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant shadow-md hover:bg-surface-container transition-colors cursor-pointer mt-4 active:scale-95"
            >
              <Icon name="my_location" />
            </button>
            <button
              type="button"
              onClick={() => map && map.setMapTypeId(map.getMapTypeId() === "roadmap" ? "satellite" : "roadmap")}
              className="w-12 h-12 bg-white border border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant shadow-md hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="layers" />
            </button>
          </div>

        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <h3 className="text-xl font-bold text-on-surface">Add New Collection Point</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-surface-container text-outline transition-colors cursor-pointer"
              >
                <Icon name="close" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-outline">Hospital Name</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. St. Jude Hospital"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-outline">Contact Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. +1 (555) 293-8822"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-outline">Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 1001 Potrero Ave, San Francisco, CA"
                    className="flex-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleLocateAddress}
                    disabled={isGeocoding}
                    className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-lg hover:bg-primary/95 transition-opacity disabled:opacity-50 cursor-pointer"
                  >
                    {isGeocoding ? "Locating..." : "Locate"}
                  </button>
                </div>
              </div>

              {geocodingError && (
                <p className="text-xs text-error font-bold">{geocodingError}</p>
              )}

              {latitude !== null && longitude !== null && (
                <div className="bg-secondary/10 p-3 rounded-lg border border-secondary/20 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-secondary flex items-center gap-1">
                      <Icon name="check_circle" className="text-sm" /> Location Verified
                    </span>
                    <p className="text-outline mt-0.5">
                      Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
                    </p>
                  </div>
                  {area && (
                    <span className="text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold uppercase px-2 py-0.5 rounded">
                      {area}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-low">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-outline text-outline font-semibold text-sm rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving || latitude === null || longitude === null}
                onClick={handleSaveHospital}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary/95 transition-shadow cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Icon name="sync" className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Icon name="save" />
                    <span>Save Point</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

