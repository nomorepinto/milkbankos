"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Icon } from "./Icon";

interface HistoryItem {
  id: string;
  type: "in" | "out";
  volumeMl: number;
  name: string;
  date: string;
}

export function InventoryHistoryTable() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch incoming batches
      const { data: batches } = await supabase
        .from("inventory_batches")
        .select("batch_id, volume_ml, collected_at, donor:donor_profiles(full_name)")
        .eq("lab_status", "verified");

      // 2. Fetch dispensing records
      const { data: dispensing } = await supabase
        .from("dispensing_records")
        .select("id, volume_ml, dispensed_date, beneficiary:beneficiaries(infant_name)")
        .eq("status", "verified");

      const merged: HistoryItem[] = [];

      if (batches) {
        batches.forEach((b: any) => {
          merged.push({
            id: `batch-${b.batch_id}`,
            type: "in",
            volumeMl: Number(b.volume_ml) || 0,
            name: b.donor?.full_name || "Unknown Donor",
            date: b.collected_at,
          });
        });
      }

      if (dispensing) {
        dispensing.forEach((d: any) => {
          merged.push({
            id: `dispensing-${d.id}`,
            type: "out",
            volumeMl: Number(d.volume_ml) || 0,
            name: d.beneficiary?.infant_name || "Unknown Beneficiary",
            date: d.dispensed_date,
          });
        });
      }

      // Sort chronologically (newest first)
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(merged);
    } catch (err) {
      console.error("Error loading inventory history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-on-surface">Inventory Transaction History</h3>
        <button
          type="button"
          onClick={fetchHistory}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          <Icon name="refresh" className="text-sm" />
          Refresh History
        </button>
      </div>

      {isLoading ? (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-12 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm font-semibold text-outline animate-pulse">Loading transaction history...</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-y-auto max-h-[40vh] custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="border-b border-outline-variant/30 bg-surface-container-low sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface w-16">Dir</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface">Volume</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface">Source / Recipient</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-medium">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant/70">
                      No transaction records found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isIn = item.type === "in";
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isIn
                            ? "bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                            : "bg-rose-500/5 hover:bg-rose-500/10 text-rose-800 dark:text-rose-300"
                        }`}
                      >
                        <td className="px-6 py-3.5 font-bold text-base text-center">
                          {isIn ? "+" : "-"}
                        </td>
                        <td className="px-6 py-3.5 tabular-nums font-bold">
                          {item.volumeMl} ml
                        </td>
                        <td className="px-6 py-3.5">
                          {item.name}
                        </td>
                        <td className="px-6 py-3.5 opacity-80 text-xs">
                          {new Date(item.date).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
