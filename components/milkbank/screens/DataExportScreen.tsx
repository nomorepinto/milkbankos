"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { supabase } from "@/lib/supabaseClient";

export interface DataExportScreenProps {}

export function DataExportScreen(_props: Readonly<DataExportScreenProps>) {
  const [format, setFormat] = useState("CSV");
  const [dataset, setDataset] = useState("inventory");

  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    previewRows: "0 Rows",
    encryption: "AES-256 Bit",
  });

  async function loadExportData() {
    // 1. Fetch export jobs
    const { data: dbJobs } = await supabase
      .from("export_jobs")
      .select("*")
      .order("requested_at", { ascending: false });

    if (dbJobs) {
      setJobs(dbJobs.map(j => ({
        id: j.id,
        dataset: j.dataset,
        format: j.format,
        rows: j.row_count,
        status: j.status,
        statusLabel: j.status_label,
        requestedAt: new Date(j.requested_at).toLocaleDateString()
      })));
    }

    // 2. Fetch stats
    const { data: dbStats } = await supabase
      .from("view_export_hub_stats")
      .select("*")
      .single();

    if (dbStats) {
      setStats({
        previewRows: dbStats.preview_rows != null ? `${dbStats.preview_rows} Rows` : "0 Rows",
        encryption: dbStats.encryption || "AES-256 Bit"
      });
    }
  }

  useEffect(() => {
    loadExportData();
  }, []);

  const handleGenerateExport = async () => {
    const newId = "EXP-" + (jobs.length + 900 + 1);
    const { error } = await supabase
      .from("export_jobs")
      .insert({
        id: newId,
        dataset: dataset === "inventory" ? "Inventory & Lab Results" : dataset === "donors" ? "Donor Registry" : "Dispensing Records",
        format: format,
        row_count: Math.floor(100 + Math.random() * 900),
        status: "pending",
        status_label: "Processing"
      });

    if (error) {
      alert("Error generating export: " + error.message);
      return;
    }

    alert("Export generation requested successfully!");
    loadExportData();
  };

  return (
    <AppShell activeSlug="data-export">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-on-surface">Data Export Hub</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">

            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
                <Icon name="tune" className="text-primary" />
                Export Configuration
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    Dataset
                  </label>
                  <select
                    value={dataset}
                    onChange={(e) => setDataset(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm"
                  >
                    <option value="inventory">Inventory & Lab Results</option>
                    <option value="donors">Donor Registry</option>
                    <option value="dispensing">Dispensing Records</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm"
                  >
                    <option value="CSV">CSV</option>
                    <option value="XLSX">XLSX</option>
                    <option value="JSON">JSON</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateExport}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-container px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
              >
                <Icon name="download" />
                Generate Export
              </button>
            </div>

            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Icon name="history" />
                Recent Exports
              </h3>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col gap-3 rounded-lg border border-outline-variant/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-on-surface">{job.dataset}</p>
                      <p className="text-sm text-on-surface-variant">
                        {job.format} · {job.rows} rows · {job.requestedAt}
                      </p>
                    </div>
                    <StatusChip label={job.statusLabel} variant={job.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-6">
              <p className="text-xs font-semibold uppercase text-on-surface-variant">
                Preview Rows
              </p>
              <p className="mt-2 text-3xl font-bold text-on-surface">{stats.previewRows}</p>
            </div>
            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <p className="text-xs font-semibold uppercase text-on-surface-variant">
                Encryption
              </p>
              <p className="mt-2 text-xl font-semibold">{stats.encryption}</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary-container/10 p-6">
              <h4 className="font-semibold text-on-surface">Need a Custom Dataset?</h4>
              <p className="mt-2 text-sm text-on-surface-variant">
                Contact the data team for bespoke regulatory exports.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
    </AppShell>
  );
}
