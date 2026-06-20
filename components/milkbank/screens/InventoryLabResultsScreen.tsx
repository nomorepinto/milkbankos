"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { supabase } from "@/lib/supabaseClient";

export interface InventoryLabResultsScreenProps {}

export function InventoryLabResultsScreen(_props: Readonly<InventoryLabResultsScreenProps>) {
  const [batches, setBatches] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalVolume: "0 ml",
    batchesToday: "0 Today",
    passRate: "0%",
    freezerTemp: "-21.4 °C",
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedStorages, setSelectedStorages] = useState<string[]>([]);
  const [minVolume, setMinVolume] = useState<string>("");
  const [maxVolume, setMaxVolume] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const { data: statsData } = await supabase.from("view_inventory_stats").select("*").single();
        if (statsData) {
          setStats({
            totalVolume: `${Number(statsData.total_volume_ml).toLocaleString()} ml`,
            batchesToday: `${statsData.batches_today} Today`,
            passRate: statsData.pass_rate_pct != null ? `${statsData.pass_rate_pct}%` : "0%",
            freezerTemp: "-21.4 °C", // static fallback temp
          });
        }

        const { data: batchesData } = await supabase
          .from("inventory_batches")
          .select("*, donor:donor_profiles(full_name)")
          .order("collected_at", { ascending: false });

        if (batchesData && batchesData.length > 0) {
          setBatches(batchesData.map(b => ({
            batchId: b.batch_id,
            donor: b.donor?.full_name || "Unknown Donor",
            volumeMl: Number(b.volume_ml),
            collected: new Date(b.collected_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).replace(',', ''),
            expiry: new Date(b.expiry_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }),
            labStatus: b.lab_status,
            labLabel: b.lab_label,
            storage: b.storage_location || "N/A"
          })));
        }
      } catch (err) {
        console.error("Error loading inventory batches:", err);
      }
    }
    loadData();
  }, []);

  const filteredBatches = batches.filter((batch) => {
    // 1. Status Filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(batch.labStatus)) {
      return false;
    }
    // 2. Storage Filter
    if (selectedStorages.length > 0) {
      const match = selectedStorages.some((storageKeyword) =>
        batch.storage.toLowerCase().includes(storageKeyword.toLowerCase())
      );
      if (!match) return false;
    }
    // 3. Volume Filter
    if (minVolume !== "" && !isNaN(Number(minVolume))) {
      if (batch.volumeMl < Number(minVolume)) return false;
    }
    if (maxVolume !== "" && !isNaN(Number(maxVolume))) {
      if (batch.volumeMl > Number(maxVolume)) return false;
    }
    return true;
  });

  return (
    <AppShell activeSlug="inventory-lab-results">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-on-surface">Inventory Management</h2>
            <p className="text-sm text-on-surface-variant">
              Real-time batch tracking, laboratory results, and cold-chain monitoring.
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Stored Volume"
              value={stats.totalVolume}
              icon="inventory_2"
              accent="primary"
            />
            <StatCard
              label="Batches Processed"
              value={stats.batchesToday}
              icon="science"
              accent="secondary"
            />
            <StatCard
              label="Lab Pass Rate"
              value={stats.passRate}
              icon="verified"
              accent="primary"
            />
            <StatCard
              label="Freezer Temp"
              value={stats.freezerTemp}
              icon="ac_unit"
              accent="neutral"
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-on-surface">Active Batches</h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  isFilterOpen || selectedStatuses.length > 0 || selectedStorages.length > 0 || minVolume || maxVolume
                    ? "bg-primary-container/10 border-primary text-primary"
                    : "border-outline-variant hover:bg-surface-container-low text-on-surface"
                }`}
              >
                <Icon name="filter_list" />
                Filter
                {(selectedStatuses.length > 0 || selectedStorages.length > 0 || minVolume || maxVolume) && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-bold">
                    {selectedStatuses.length + selectedStorages.length + (minVolume ? 1 : 0) + (maxVolume ? 1 : 0)}
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 z-50 w-80 rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-bold text-on-surface text-sm">Filter Batches</span>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    >
                      <Icon name="close" className="text-lg" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Status Section */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Lab Status</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: "verified", label: "Verified" },
                          { key: "pending", label: "Pending QC" },
                          { key: "fail", label: "Failed" }
                        ].map(status => {
                          const isSelected = selectedStatuses.includes(status.key);
                          return (
                            <button
                              key={status.key}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedStatuses(selectedStatuses.filter(s => s !== status.key));
                                } else {
                                  setSelectedStatuses([...selectedStatuses, status.key]);
                                }
                              }}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-primary-container text-white border-primary-container"
                                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                              }`}
                            >
                              {status.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Storage Location Section */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Storage Area</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: "Freezer A", label: "Freezer A" },
                          { key: "Freezer B", label: "Freezer B" },
                          { key: "Quarantine", label: "Quarantine" }
                        ].map(storage => {
                          const isSelected = selectedStorages.includes(storage.key);
                          return (
                            <button
                              key={storage.key}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedStorages(selectedStorages.filter(s => s !== storage.key));
                                } else {
                                  setSelectedStorages([...selectedStorages, storage.key]);
                                }
                              }}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-secondary text-white border-secondary"
                                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                              }`}
                            >
                              {storage.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Volume Range Section */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Volume Range (mL)</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="number"
                            placeholder="Min"
                            value={minVolume}
                            onChange={(e) => setMinVolume(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold outline-none focus:border-primary text-on-surface"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Max"
                            value={maxVolume}
                            onChange={(e) => setMaxVolume(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold outline-none focus:border-primary text-on-surface"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-outline-variant/20 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatuses([]);
                        setSelectedStorages([]);
                        setMinVolume("");
                        setMaxVolume("");
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="px-4 py-1.5 text-xs font-bold bg-primary-container text-white rounded-lg cursor-pointer hover:brightness-95"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-outline-variant/30 bg-surface-container-low">
                  <tr>
                    {[
                      "Batch ID",
                      "Donor",
                      "Volume",
                      "Collected",
                      "Expiry",
                      "Lab Status",
                      "Storage",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-on-surface"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-on-surface-variant">
                        No batches match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((batch, index) => (
                      <tr
                        key={batch.batchId}
                        className={
                          index % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface-container-low/50"
                        }
                      >
                        <td className="px-4 py-3 font-medium text-primary">{batch.batchId}</td>
                        <td className="px-4 py-3">{batch.donor}</td>
                        <td className="px-4 py-3 tabular-nums">{batch.volumeMl} ml</td>
                        <td className="px-4 py-3 text-on-surface-variant">{batch.collected}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{batch.expiry}</td>
                        <td className="px-4 py-3">
                          <StatusChip label={batch.labLabel} variant={batch.labStatus} />
                        </td>
                        <td className="px-4 py-3">{batch.storage}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
