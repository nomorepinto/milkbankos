"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { supabase } from "@/lib/supabaseClient";

export interface BeneficiaryDispensingScreenProps {}

export function BeneficiaryDispensingScreen(_props: Readonly<BeneficiaryDispensingScreenProps>) {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    async function loadDispensing() {
      const { data } = await supabase
        .from("dispensing_records")
        .select("*, beneficiary:beneficiaries(infant_name)");

      if (data) {
        setRecords(data.map(r => ({
          id: r.id,
          beneficiary: r.beneficiary?.infant_name || "Unknown",
          ward: r.ward,
          volumeMl: Number(r.volume_ml),
          date: r.dispensed_date,
          priority: r.priority,
          status: r.status,
          statusLabel: r.status_label
         })));
      }
    }
    loadDispensing();
  }, []);

  const critical = records.filter((r) => r.priority === "critical");

  return (
    <AppShell activeSlug="beneficiary-dispensing">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px] space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase text-on-surface-variant">
              Beneficiary Data
            </p>
            <h3 className="text-3xl font-bold text-on-surface">Dispensing Records</h3>
          </div>

          <div className="rounded-xl border border-tertiary/30 bg-tertiary/5 p-6">
            <h4 className="text-lg font-semibold text-tertiary">
              Critical Priority: Premature Infants
            </h4>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {critical.map((record) => (
                <div
                  key={record.id}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4"
                >
                  <h5 className="font-semibold text-on-surface">{record.beneficiary}</h5>
                  <p className="text-sm text-on-surface-variant">{record.ward}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm tabular-nums">{record.volumeMl} ml</span>
                    <StatusChip label={record.statusLabel} variant={record.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-primary-dark p-6 text-white">
            <h5 className="text-lg font-semibold">NICU Monitoring Flow</h5>
            <p className="mt-2 text-sm text-white/70">
              Track real-time dispensing against physician orders and inventory allocation.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-surface-container-low">
                  <tr>
                    {["Record ID", "Beneficiary", "Ward", "Volume", "Date", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, i) => (
                    <tr
                      key={record.id}
                      className={i % 2 === 0 ? "" : "bg-surface-container-low/50"}
                    >
                      <td className="px-4 py-3 font-medium text-primary">{record.id}</td>
                      <td className="px-4 py-3">{record.beneficiary}</td>
                      <td className="px-4 py-3">{record.ward}</td>
                      <td className="px-4 py-3 tabular-nums">{record.volumeMl} ml</td>
                      <td className="px-4 py-3">{record.date}</td>
                      <td className="px-4 py-3">
                        <StatusChip label={record.statusLabel} variant={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Icon name="add" />
            New Dispensing Record
          </button>
        </div>
      </main>
    </AppShell>
  );
}
