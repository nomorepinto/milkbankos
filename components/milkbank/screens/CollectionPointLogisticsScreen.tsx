"use client";

import { useState } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { LogisticsSubNav } from "@/components/milkbank/layout/LogisticsSubNav";
import { Icon } from "@/components/milkbank/ui/Icon";

export interface CollectionPointLogisticsScreenProps {}

type MapPoint = {
  id: string;
  name: string;
  type: "hospital" | "shipping";
  status: "active" | "busy" | "idle";
  capacity?: string;
  departure?: string;
  expiry?: string;
  top: string;
  left: string;
};

const INITIAL_POINTS: MapPoint[] = [
  {
    id: "FC-01",
    name: "St. Jude Medical Plaza",
    type: "hospital",
    status: "active",
    top: "35%",
    left: "42%",
  },
  {
    id: "FC-02",
    name: "City General Hospital",
    type: "hospital",
    status: "active",
    top: "48%",
    left: "25%",
  },
  {
    id: "MH-01",
    name: "Mission District Unit B",
    type: "shipping",
    status: "busy",
    capacity: "84% filled",
    departure: "16:30 PST",
    expiry: "2h 14m",
    top: "55%",
    left: "58%",
  },
  {
    id: "MH-02",
    name: "Bayview Collection Hub",
    type: "shipping",
    status: "idle",
    capacity: "32% filled",
    departure: "18:00 PST",
    expiry: "3h 45m",
    top: "65%",
    left: "70%",
  },
];

export function CollectionPointLogisticsScreen(_props: Readonly<CollectionPointLogisticsScreenProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFixedCenters, setShowFixedCenters] = useState(true);
  const [showMobileHubs, setShowMobileHubs] = useState(true);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  const filteredPoints = INITIAL_POINTS.filter((point) => {
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
        <div className="relative flex-1 bg-surface-container-low [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] overflow-hidden">
          
          {/* Simulated Map Background */}
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover opacity-60 grayscale-[20%] brightness-[105%] select-none pointer-events-none"
              alt="Stylized medical logistics map"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEebmRXfNblSaJicu7PL6SekRPlCLTyxgljfjrdVDBQs226dndbRe-EqPbLJn6bNpwTLGtRHN3HgTAJNTezBHo6slB6jHp9HKnsjeuurE9UlBA6guosWCcSCpCdXvt2i6qqiP7ec1jBsxDl8UqPxtIOPRLeyG48KirFNr5uVcXofG8X3eOKgPmkfvTU7bQFd8Q0sT5meapv4hPqzBm4SWgfxEazeINNYqTDihDSyJR-caxuf8AWGXegEL8QxtnWPb-qL7I1MN9sXg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/90 via-transparent to-transparent pointer-events-none h-[15%]" />
          </div>

          {/* Interactive Pins */}
          {filteredPoints.map((point) => {
            const isOpened = activePointId === point.id || hoveredPointId === point.id;
            const isHospital = point.type === "hospital";
            
            const markerBgClass = isHospital
              ? "bg-primary text-white"
              : "bg-secondary text-white";

            const markerIcon = isHospital ? "local_hospital" : "local_shipping";

            return (
              <div
                key={point.id}
                style={{ top: point.top, left: point.left }}
                className="absolute z-20"
                onMouseEnter={() => setHoveredPointId(point.id)}
                onMouseLeave={() => setHoveredPointId(null)}
                onClick={() => setActivePointId(activePointId === point.id ? null : point.id)}
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
                    className={`absolute bottom-12 left-1/2 -translate-x-1/2 w-64 rounded-xl bg-white/80 p-4 border border-slate-500/10 shadow-2xl backdrop-blur-md transition-all duration-300 pointer-events-none ${
                      isOpened ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                        isHospital ? "bg-primary-container text-white" : "bg-secondary-fixed text-on-secondary-fixed"
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
                      <p className="text-xs text-on-surface-variant leading-snug">
                        Primary reception center. Operational 24/7 for lab analysis.
                      </p>
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

          {/* Overlays */}
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col h-full justify-between">
            {/* Header & Search */}
            <div className="flex justify-between items-start pointer-events-auto w-full">
              <div className="bg-white/80 border border-slate-500/10 rounded-xl p-4 w-96 shadow-md backdrop-blur-md">
                <h1 className="text-xl font-bold text-on-surface mb-1">Donor Community Map</h1>
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
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-lg hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
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
                  <p className="text-2xl text-primary font-bold">08</p>
                </div>
                <div className="border-r border-outline-variant/35 pr-8">
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Today&apos;s Intake</p>
                  <p className="text-2xl text-secondary font-bold">42.5 L</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-wider mb-1">Live Donors</p>
                  <p className="text-2xl text-tertiary font-bold">124</p>
                </div>
              </div>

            </div>

          </div>

          {/* Floating Map Zoom Actions */}
          <div className="absolute right-6 top-24 flex flex-col gap-2 z-20">
            <button
              type="button"
              className="w-12 h-12 bg-white border border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant shadow-md hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="add" />
            </button>
            <button
              type="button"
              className="w-12 h-12 bg-white border border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant shadow-md hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="remove" />
            </button>
            <button
              type="button"
              className="w-12 h-12 bg-white border border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant shadow-md hover:bg-surface-container transition-colors cursor-pointer mt-4 active:scale-95"
            >
              <Icon name="my_location" />
            </button>
            <button
              type="button"
              className="w-12 h-12 bg-white border border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant shadow-md hover:bg-surface-container transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="layers" />
            </button>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
