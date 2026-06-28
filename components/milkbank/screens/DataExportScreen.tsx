"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { supabase } from "@/lib/supabaseClient";

export interface DataExportScreenProps { }

export function DataExportScreen(_props: Readonly<DataExportScreenProps>) {
  const [format, setFormat] = useState("CSV");
  const [dataset, setDataset] = useState("inventory");

  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    previewRows: "0 Rows",
    encryption: "AES-256 Bit",
  });

  // Modal State
  const [activeSummaryJob, setActiveSummaryJob] = useState<any | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
        requestedAt: new Date(j.requested_at).toLocaleDateString(),
        fileUrl: j.file_url
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

  // Fetch sample preview data when activeSummaryJob changes
  useEffect(() => {
    if (!activeSummaryJob) {
      setPreviewRows([]);
      return;
    }

    async function fetchPreview() {
      setLoadingPreview(true);
      let dbTable = "";
      if (activeSummaryJob.dataset.includes("Inventory")) {
        dbTable = "inventory_batches";
      } else if (activeSummaryJob.dataset.includes("Donor")) {
        dbTable = "donor_profiles";
      } else if (activeSummaryJob.dataset.includes("Dispensing")) {
        dbTable = "dispensing_records";
      }

      if (dbTable) {
        try {
          const { data, error } = await supabase
            .from(dbTable)
            .select("*")
            .limit(3);
          if (!error && data) {
            setPreviewRows(data);
          }
        } catch (e) {
          console.error("Failed to fetch preview data:", e);
        }
      }
      setLoadingPreview(false);
    }

    fetchPreview();
  }, [activeSummaryJob]);

  const handleGenerateExport = async () => {
    // Find the maximum ID number from the active jobs list to avoid duplicates after deletion
    let maxNum = 900;
    for (const j of jobs) {
      const match = j.id.match(/^EXP-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const newId = `EXP-${maxNum + 1}`;
    const { error } = await supabase
      .from("export_jobs")
      .insert({
        id: newId,
        dataset: dataset === "inventory" ? "Inventory & Lab Results" : dataset === "donors" ? "Donor Registry" : "Dispensing Records",
        format: format,
        row_count: 0,
        status: "pending",
        status_label: "Processing"
      });

    if (error) {
      alert("Error generating export: " + error.message);
      return;
    }

    loadExportData();

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: newId, dataset, format }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process export file");
      }
      alert("Export file generated successfully!");
    } catch (err: any) {
      alert("Error processing export: " + err.message);
      await supabase
        .from("export_jobs")
        .update({ status: "fail", status_label: "Failed" })
        .eq("id", newId);
    } finally {
      loadExportData();
    }
  };

  const handleDeleteJob = async (jobId: string, fileUrl: string) => {
    try {
      const response = await fetch("/api/export", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, fileUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete export job");
      }
      alert("Export job removed successfully.");
      loadExportData();
    } catch (err: any) {
      alert("Error deleting export: " + err.message);
    }
  };

  return (
    <AppShell activeSlug="data-export">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-on-surface">Data Export Hub</h2>
          </div>
          <div className="grid gap-8">
            <div className="space-y-6">

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
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-transparent bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-transparent hover:text-primary hover:border-primary active:scale-[0.97] hover:scale-[1.02] cursor-pointer"
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
                      <div className="flex items-center gap-3">
                        {job.status === "verified" && job.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setActiveSummaryJob(job)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-transparent hover:text-primary active:scale-[0.97] hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                          >
                            <Icon name="download" className="text-sm" />
                            Download
                          </button>
                        )}
                        {deleteConfirmId === job.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteJob(job.id, job.fileUrl);
                                setDeleteConfirmId(null);
                              }}
                              className="rounded-lg bg-error px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-transparent hover:text-error hover:border hover:border-error transition-all duration-300 active:scale-95 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-all duration-300 active:scale-95 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(job.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-transparent p-1.5 text-on-surface-variant hover:border-error hover:text-error hover:bg-error/5 active:scale-[0.90] transition-all duration-300 cursor-pointer"
                            title="Delete export job"
                          >
                            <Icon name="delete" className="text-lg" />
                          </button>
                        )}
                        <StatusChip label={job.statusLabel} variant={job.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Summary / Preview Modal */}
      {activeSummaryJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-xl border border-outline-variant/30 bg-surface-container p-6 shadow-2xl transition-transform duration-300 scale-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface">Export Summary & Preview</h3>
              <button
                onClick={() => setActiveSummaryJob(null)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95 duration-200 cursor-pointer"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-container-low p-4 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase text-on-surface-variant">Dataset</span>
                  <p className="font-medium text-on-surface mt-0.5">{activeSummaryJob.dataset}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-on-surface-variant">Format</span>
                  <p className="font-medium text-on-surface mt-0.5">{activeSummaryJob.format}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-on-surface-variant">Total Rows</span>
                  <p className="font-medium text-on-surface mt-0.5">{activeSummaryJob.rows} records</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-on-surface-variant">Generated On</span>
                  <p className="font-medium text-on-surface mt-0.5">{activeSummaryJob.requestedAt}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-on-surface-variant">Sample Records Preview (Top 3)</h4>
                {loadingPreview ? (
                  <div className="py-6 text-center text-sm text-on-surface-variant">Loading preview data...</div>
                ) : previewRows.length === 0 ? (
                  <div className="py-6 text-center text-sm text-on-surface-variant">No records available for preview</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-outline-variant/20 bg-surface-container-lowest">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                          {Object.keys(previewRows[0]).slice(0, 4).map((k) => (
                            <th key={k} className="p-3 font-semibold uppercase text-on-surface-variant">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/30">
                            {Object.keys(row).slice(0, 4).map((k) => (
                              <td key={k} className="p-3 text-on-surface truncate max-w-[150px]">{String(row[k] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-outline-variant/20 pt-4">
              <button
                onClick={() => setActiveSummaryJob(null)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors active:scale-95 duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <a
                href={activeSummaryJob.fileUrl}
                download
                onClick={() => setActiveSummaryJob(null)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-transparent hover:text-primary active:scale-[0.97] hover:scale-[1.02] cursor-pointer"
              >
                <Icon name="download" className="text-sm" />
                Confirm Download
              </a>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
