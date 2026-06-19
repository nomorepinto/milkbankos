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
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm"
              >
                <Icon name="filter_list" />
                Filter
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-3 py-2 text-sm font-semibold text-white"
              >
                <Icon name="add" />
                Add Batch
              </button>
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
                  {batches.map((batch, index) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
