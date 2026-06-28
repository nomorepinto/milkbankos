"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { DonorSubNav } from "@/components/milkbank/layout/DonorSubNav";
import { Icon } from "@/components/milkbank/ui/Icon";
import { supabase } from "@/lib/supabaseClient";

declare const google: any;

export interface MapPin {
  id: string;
  name: string;
  status: "verified" | "neutral" | "fail" | "pending";
  statusLabel: string;
  lastDonation: string;
  latitude: number;
  longitude: number;
}

export interface DonorCommunityMapScreenProps { }

export function DonorCommunityMapScreen(_props: Readonly<DonorCommunityMapScreenProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  const [pins, setPins] = useState<MapPin[]>([]);
  const [legendStats, setLegendStats] = useState({ active: 0, inactive: 0, unverified: 0 });
  const [regions, setRegions] = useState<any[]>([]);

  // Google Maps State
  const [map, setMap] = useState<any>(null);
  const [pinPositions, setPinPositions] = useState<Record<string, { top: string; left: string; visible: boolean }>>({});

  useEffect(() => {
    async function loadMapData() {
      // 1. Fetch pins
      const { data: dbPins } = await supabase
        .from("donor_profiles")
        .select("*");

      if (dbPins) {
        setPins(dbPins
          .filter(p => p.latitude !== null && p.longitude !== null)
          .map(p => {
            return {
              id: p.display_id,
              name: p.full_name,
              status: p.status,
              statusLabel: p.status_label,
              lastDonation: p.last_donation_at || "N/A",
              latitude: Number(p.latitude),
              longitude: Number(p.longitude)
            };
          })
        );
      }

      // 2. Fetch legend stats
      const { data: dbLegend } = await supabase
        .from("view_map_legend_stats")
        .select("*")
        .single();

      if (dbLegend) {
        setLegendStats(dbLegend);
      }

      // 3. Fetch regional activity
      const { data: dbRegions } = await supabase
        .from("view_regional_activity")
        .select("*");

      if (dbRegions) {
        setRegions(dbRegions.map(r => ({
          name: r.region,
          percentage: r.percentage + "%"
        })));
      }
    }

    loadMapData();
  }, []);

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
        zoomControl: true,
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

  // Auto-center and highlight pin if donorId is present in URL query parameters,
  // otherwise auto-center the map to the first entry fetched's coordinates
  useEffect(() => {
    if (!map || pins.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const donorId = params.get("donorId");
    if (donorId) {
      const targetPin = pins.find(p => p.id === donorId);
      if (targetPin) {
        map.setCenter({ lat: targetPin.latitude, lng: targetPin.longitude });
        map.setZoom(15);
        setActivePinId(targetPin.id);
      }
    } else if (pins[0]) {
      map.setCenter({ lat: pins[0].latitude, lng: pins[0].longitude });
    }
  }, [map, pins]);

  // Track map projection to synchronize React HTML pins with map lat/lng coordinates
  useEffect(() => {
    if (!map || pins.length === 0) return;

    const overlay = new google.maps.OverlayView();
    overlay.onAdd = () => { };
    overlay.onRemove = () => { };
    overlay.draw = () => {
      const projection = overlay.getProjection();
      if (!projection) return;

      const newPositions: Record<string, { top: string; left: string; visible: boolean }> = {};
      pins.forEach(pin => {
        const latLng = new google.maps.LatLng(pin.latitude, pin.longitude);
        const pos = projection.fromLatLngToContainerPixel(latLng);
        if (pos) {
          newPositions[pin.id] = {
            top: `${pos.y}px`,
            left: `${pos.x}px`,
            visible: true
          };
        } else {
          newPositions[pin.id] = {
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
  }, [map, pins]);

  const filteredPins = pins.filter((pin) => {
    const matchesSearch =
      pin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pin.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      !selectedStatus ||
      (selectedStatus === "Active" && pin.status === "verified") ||
      (selectedStatus === "Inactive" && pin.status === "neutral") ||
      (selectedStatus === "Flagged" && pin.status === "fail");

    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell activeSlug="donor-community-map" fullBleed>
      <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background">
        <DonorSubNav activeTab="locations" />

        {/* Map Canvas */}
        <div className="relative flex-1 bg-surface-container-low">

          {/* Real Google Map Background */}
          <div id="google-map-bg" className="absolute inset-0 z-0 h-full w-full" />

          {/* UI Overlay: Search & Filters */}
          <div className="absolute top-6 left-6 z-10 flex gap-4">
            <div className="flex w-80 items-center rounded-lg border border-white/30 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md focus-within:border-primary transition-colors">
              <Icon name="search" className="mr-2 text-outline" />
              <input
                className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
                placeholder="Search donors by ID or name..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="relative">
              <button
                type="button"
                className="flex items-center rounded-lg border border-white/30 bg-white/80 px-4 py-2 text-sm shadow-sm backdrop-blur-md hover:bg-white transition-colors cursor-pointer"
                onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
              >
                <Icon name="filter_list" className="mr-2 text-primary" />
                <span className="font-semibold text-on-surface">
                  {selectedStatus ? `Status: ${selectedStatus}` : "Filters"}
                </span>
              </button>

              {showFiltersDropdown && (
                <div className="absolute left-0 mt-2 w-48 rounded-lg border border-outline-variant/30 bg-white p-2 shadow-xl z-20">
                  <div className="text-xs font-semibold text-outline px-3 py-1.5 uppercase tracking-wider">
                    Filter Status
                  </div>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-container-low transition-colors"
                    onClick={() => {
                      setSelectedStatus(null);
                      setShowFiltersDropdown(false);
                    }}
                  >
                    All Statuses
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-container-low transition-colors"
                    onClick={() => {
                      setSelectedStatus("Active");
                      setShowFiltersDropdown(false);
                    }}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-container-low transition-colors"
                    onClick={() => {
                      setSelectedStatus("Inactive");
                      setShowFiltersDropdown(false);
                    }}
                  >
                    Inactive
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-container-low transition-colors"
                    onClick={() => {
                      setSelectedStatus("Flagged");
                      setShowFiltersDropdown(false);
                    }}
                  >
                    Flagged
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* UI Overlay: View Switcher */}
          <div className="absolute top-6 right-6 z-10">
            <Link href="/donor-directory">
              <button
                type="button"
                className="flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-primary/95 transition-all active:scale-95 cursor-pointer"
              >
                <Icon name="list" className="mr-2" />
                <span className="uppercase tracking-wider text-xs">Switch to List View</span>
              </button>
            </Link>
          </div>

          {/* UI Overlay: Legend */}
          <div className="absolute bottom-6 left-6 z-10 rounded-xl border border-outline-variant/30 bg-white/85 p-4 shadow-sm backdrop-blur-md w-48">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Donor Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#00C853]" />
                <span className="text-xs font-semibold text-on-surface">Active ({pins.filter(p => p.status === "verified").length})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#FF1744]" />
                <span className="text-xs font-semibold text-on-surface">Inactive ({pins.filter(p => p.status === "neutral").length})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#FFD600]" />
                <span className="text-xs font-semibold text-on-surface">Unverified ({pins.filter(p => p.status === "pending").length})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#2979FF]" />
                <span className="text-xs font-semibold text-on-surface">Flagged ({pins.filter(p => p.status === "fail").length})</span>
              </div>
            </div>
          </div>

          {/* Sibling overlay for custom interactive React pins */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden h-full w-full">
            {filteredPins.map((pin) => {
              const pos = pinPositions[pin.id];
              if (!pos || !pos.visible) return null;

              const isOpened = activePinId === pin.id || hoveredPinId === pin.id;
              const pinColorClass =
                pin.status === "verified"
                  ? "text-[#00C853]"
                  : pin.status === "neutral"
                    ? "text-[#FF1744]"
                    : pin.status === "pending"
                      ? "text-[#FFD600] animate-pulse"
                      : "text-[#2979FF] animate-pulse"; // Flagged is bright blue

              const badgeBgClass =
                pin.status === "verified"
                  ? "bg-[#00C853]/15 text-[#00C853]"
                  : pin.status === "neutral"
                    ? "bg-[#FF1744]/15 text-[#FF1744]"
                    : pin.status === "pending"
                      ? "bg-[#FFD600]/20 text-[#FF8F00]"
                      : "bg-[#2979FF]/15 text-[#2979FF]";

              return (
                <div
                  key={pin.id}
                  style={{
                    top: pos.top,
                    left: pos.left,
                    transform: "translate(-50%, -100%)" // Anchor pin bottom exactly at coordinate
                  }}
                  className="absolute pointer-events-auto"
                  onMouseEnter={() => setHoveredPinId(pin.id)}
                  onMouseLeave={() => setHoveredPinId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePinId(activePinId === pin.id ? null : pin.id);
                  }}
                >
                  <div className="relative cursor-pointer">
                    <Icon
                      name="location_on"
                      filled
                      className={`text-4xl drop-shadow-md transition-transform hover:scale-125 ${pinColorClass}`}
                    />

                    {/* Pin Info Popup */}
                    <div
                      className={`absolute bottom-full left-1/2 mb-4 w-52 -translate-x-1/2 rounded-lg border border-outline-variant/30 bg-white/95 p-3 shadow-xl transition-all duration-200 pointer-events-none ${isOpened ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
                        }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${badgeBgClass}`}>
                          {pin.statusLabel}
                        </span>
                        <span className="text-[10px] font-semibold text-outline">ID: {pin.id}</span>
                      </div>
                      <p className="text-xs font-bold text-on-surface leading-tight">{pin.name}</p>
                      <p className="mt-1 text-[11px] text-on-surface-variant">
                        {pin.status === "fail" ? "Issue:" : "Last Donation:"} <span className="font-semibold">{pin.lastDonation}</span>
                      </p>
                      <div className="mt-3 border-t border-outline-variant/20 pt-2 flex justify-between items-center pointer-events-auto">
                        <Link href={`/donor-directory?donorId=${pin.id}`} className="text-[11px] font-bold text-primary hover:underline">
                          View Registry
                        </Link>
                      </div>
                      <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border border-outline-variant/30 bg-white/95 border-t-0 border-l-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

