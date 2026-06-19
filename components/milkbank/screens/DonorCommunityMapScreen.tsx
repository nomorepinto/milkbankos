"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { DonorSubNav } from "@/components/milkbank/layout/DonorSubNav";
import { Icon } from "@/components/milkbank/ui/Icon";
import { supabase } from "@/lib/supabaseClient";

export interface MapPin {
  id: string;
  name: string;
  status: "verified" | "neutral" | "fail";
  statusLabel: string;
  lastDonation: string;
  top: string;
  left: string;
}

const PIN_POSITIONS: Record<string, { top: string; left: string }> = {
  "DON-8821": { top: "30%", left: "45%" },
  "DON-7712": { top: "38%", left: "58%" },
  "DON-3109": { top: "60%", left: "35%" },
  "DON-2201": { top: "22%", left: "28%" },
  "DON-1194": { top: "45%", left: "65%" },
};

export interface DonorCommunityMapScreenProps {}

export function DonorCommunityMapScreen(_props: Readonly<DonorCommunityMapScreenProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  const [pins, setPins] = useState<MapPin[]>([]);
  const [legendStats, setLegendStats] = useState({ active: 0, inactive: 0, unverified: 0 });
  const [regions, setRegions] = useState<any[]>([]);

  useEffect(() => {
    async function loadMapData() {
      // 1. Fetch pins
      const { data: dbPins } = await supabase
        .from("donor_profiles")
        .select("*");

      if (dbPins) {
        setPins(dbPins.map(p => {
          const pos = PIN_POSITIONS[p.display_id] || { top: "50%", left: "50%" };
          return {
            id: p.display_id,
            name: p.full_name,
            status: p.status,
            statusLabel: p.status_label,
            lastDonation: p.last_donation_at || "N/A",
            top: pos.top,
            left: pos.left
          };
        }));
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
        <div className="relative flex-1 bg-surface-container-low [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
          
          {/* Simulated Map Background */}
          <div className="absolute inset-0 z-0">
            <img
              className="h-full w-full object-cover grayscale opacity-30 select-none pointer-events-none"
              alt="Metropolitan area topographic map view"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOwsE3F-QcS7zpR36UDf-ILRgQTHdB8e-ZGXhFpAsX3zudW7G2rjQVEkkQI3S14__X8MOLH4iwtslCwI8T9MwYKxoUMJpnPJvF1lohioY11jpTIIBlAxKZ2_CNFSoqm6Ui6p8KwgpgRPWyLeaznif16qIZolCZiI73C6Q1Quv_15Csx5CrbSt_l9o4GHUmMYli-F1SH_aS9oPPcbDg1nIhCGD5lYVmmFoOz8FjzLayzyEj2kAGyvQxbrDiWv0MJlLlnuXjHH6NBsE"
            />
          </div>

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
                <div className="h-3 w-3 rounded-full bg-secondary" />
                <span className="text-xs font-semibold text-on-surface">Active ({legendStats.active})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-outline" />
                <span className="text-xs font-semibold text-on-surface">Inactive ({legendStats.inactive})</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-tertiary-container" />
                <span className="text-xs font-semibold text-on-surface">Unverified ({legendStats.unverified})</span>
              </div>
            </div>
          </div>

          {/* Interactive Pins */}
          {filteredPins.map((pin) => {
            const isOpened = activePinId === pin.id || hoveredPinId === pin.id;
            const pinColorClass =
              pin.status === "verified"
                ? "text-secondary"
                : pin.status === "neutral"
                  ? "text-outline"
                  : "text-tertiary-container animate-pulse";
            
            const badgeBgClass =
              pin.status === "verified"
                ? "bg-secondary-fixed text-on-secondary-fixed"
                : pin.status === "neutral"
                  ? "bg-surface-variant text-on-surface-variant"
                  : "bg-tertiary-fixed text-on-tertiary-fixed";

            return (
              <div
                key={pin.id}
                style={{ top: pin.top, left: pin.left }}
                className="absolute z-20"
                onMouseEnter={() => setHoveredPinId(pin.id)}
                onMouseLeave={() => setHoveredPinId(null)}
                onClick={() => setActivePinId(activePinId === pin.id ? null : pin.id)}
              >
                <div className="relative cursor-pointer">
                  <Icon
                    name="location_on"
                    filled
                    className={`text-4xl drop-shadow-md transition-transform hover:scale-125 ${pinColorClass}`}
                  />
                  
                  {/* Pin Info Popup */}
                  <div
                    className={`absolute bottom-full left-1/2 mb-4 w-52 -translate-x-1/2 rounded-lg border border-outline-variant/30 bg-white/95 p-3 shadow-xl transition-all duration-200 pointer-events-none ${
                      isOpened ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
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
                      <Link href="/donor-directory" className="text-[11px] font-bold text-primary hover:underline">
                        View Registry
                      </Link>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border border-outline-variant/30 bg-white/95 border-t-0 border-l-0" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Floating Navigation Stats (Bottom Right) */}
          <div className="absolute bottom-6 right-6 z-10 w-64 rounded-2xl border border-outline-variant/30 bg-white/90 p-4 shadow-xl backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Regional Activity</h4>
              <Icon name="trending_up" className="text-secondary" />
            </div>
            <div className="space-y-3">
              {regions.map((region, idx) => (
                <div key={region.name}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-on-surface-variant">{region.name}</span>
                    <span className="font-bold text-on-surface">{region.percentage}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-container">
                    <div
                      className={`h-full rounded-full ${idx % 2 === 0 ? "bg-primary" : "bg-secondary"}`}
                      style={{ width: region.percentage }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-primary-dark py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-black transition-colors cursor-pointer"
            >
              Download Map Data
            </button>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
