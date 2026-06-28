"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { supabase } from "@/lib/supabaseClient";
import { InventoryHistoryTable } from "@/components/milkbank/ui/InventoryHistoryTable";

export interface InventoryLabResultsScreenProps { }

export function InventoryLabResultsScreen(_props: Readonly<InventoryLabResultsScreenProps>) {
  const [batches, setBatches] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalVolume: "0 ml",
    batchesToday: "0 Today",
    passRate: "0%",
    freezerTemp: "-21.4 °C",
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedStorages, setSelectedStorages] = useState<string[]>([]);
  const [minVolume, setMinVolume] = useState<string>("");
  const [maxVolume, setMaxVolume] = useState<string>("");

  const loadData = async () => {
    try {
      const { data: statsData } = await supabase.from("view_inventory_stats").select("*").single();
      
      const { data: incomingData } = await supabase
        .from("inventory_batches")
        .select("volume_ml")
        .eq("lab_status", "verified");

      const { data: outgoingData } = await supabase
        .from("dispensing_records")
        .select("volume_ml")
        .eq("status", "verified");

      const totalIncoming = incomingData ? incomingData.reduce((sum, b) => sum + (Number(b.volume_ml) || 0), 0) : 0;
      const totalOutgoing = outgoingData ? outgoingData.reduce((sum, d) => sum + (Number(d.volume_ml) || 0), 0) : 0;
      const currentVol = totalIncoming - totalOutgoing;

      if (statsData) {
        setStats({
          totalVolume: `${currentVol.toLocaleString()} ml`,
          batchesToday: `${statsData.batches_today} Today`,
          passRate: statsData.pass_rate_pct != null ? `${statsData.pass_rate_pct}%` : "0%",
          freezerTemp: "-21.4 °C", // static fallback temp
        });
      }

      const { data: batchesData } = await supabase
        .from("inventory_batches")
        .select("*, donor:donor_profiles(full_name)")
        .order("collected_at", { ascending: false });

      if (batchesData) {
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
          rawExpiry: b.expiry_date,
          labStatus: b.lab_status,
          labLabel: b.lab_label,
          storage: b.storage_location || "N/A"
        })));
      }
    } catch (err) {
      console.error("Error loading inventory batches:", err);
    }
  };

  useEffect(() => {
    async function init() {
      setIsLoadingData(true);
      await loadData();
      setIsLoadingData(false);
    }
    init();
  }, []);

  const handleStatusChange = async (batchId: string, newStatus: string) => {
    let labLabel = "Pending QC";
    if (newStatus === "verified") labLabel = "Verified";
    else if (newStatus === "fail") labLabel = "Failed";
    else if (newStatus === "neutral") labLabel = "Neutral";

    try {
      const { error } = await supabase
        .from("inventory_batches")
        .update({ lab_status: newStatus, lab_label: labLabel })
        .eq("batch_id", batchId);

      if (error) throw error;

      setBatches((prev) =>
        prev.map((b) =>
          b.batchId === batchId ? { ...b, labStatus: newStatus, labLabel: labLabel } : b
        )
      );

      // Reload stats
      const { data: statsData } = await supabase.from("view_inventory_stats").select("*").single();
      
      const { data: incomingData } = await supabase
        .from("inventory_batches")
        .select("volume_ml")
        .eq("lab_status", "verified");

      const { data: outgoingData } = await supabase
        .from("dispensing_records")
        .select("volume_ml")
        .eq("status", "verified");

      const totalIncoming = incomingData ? incomingData.reduce((sum, b) => sum + (Number(b.volume_ml) || 0), 0) : 0;
      const totalOutgoing = outgoingData ? outgoingData.reduce((sum, d) => sum + (Number(d.volume_ml) || 0), 0) : 0;
      const currentVol = totalIncoming - totalOutgoing;

      if (statsData) {
        setStats({
          totalVolume: `${currentVol.toLocaleString()} ml`,
          batchesToday: `${statsData.batches_today} Today`,
          passRate: statsData.pass_rate_pct != null ? `${statsData.pass_rate_pct}%` : "0%",
          freezerTemp: "-21.4 °C",
        });
      }
      setHistoryRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editVolume, setEditVolume] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [editStorage, setEditStorage] = useState("");
  const [editStatus, setEditStatus] = useState("pending");
  const [editLabel, setEditLabel] = useState("Pending QC");

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [deletingBatch, setDeletingBatch] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatuses, selectedStorages, minVolume, maxVolume]);

  const openDeleteModal = (batch: any) => {
    setDeletingBatch(batch);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteBatch = async () => {
    if (!deletingBatch) return;

    try {
      const { error } = await supabase
        .from("inventory_batches")
        .delete()
        .eq("batch_id", deletingBatch.batchId);

      if (error) throw error;

      alert(`Success! Deleted batch: ${deletingBatch.batchId}`);
      setIsDeleteModalOpen(false);
      setDeletingBatch(null);
      loadData();
      setHistoryRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error deleting batch: " + err.message);
    }
  };

  const [donors, setDonors] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addBatchId, setAddBatchId] = useState("");
  const [addDonorId, setAddDonorId] = useState("");
  const [addVolume, setAddVolume] = useState("");
  const [addCollectedAt, setAddCollectedAt] = useState("");
  const [addExpiry, setAddExpiry] = useState("");
  const [addStatus, setAddStatus] = useState("pending");
  const [addStorage, setAddStorage] = useState("");

  const loadDonors = async () => {
    try {
      const { data } = await supabase
        .from("donor_profiles")
        .select("id, full_name, display_id")
        .order("full_name");
      if (data) {
        setDonors(data);
      }
    } catch (err) {
      console.error("Error loading donors:", err);
    }
  };

  useEffect(() => {
    loadDonors();
  }, []);

  const handleSubmitAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBatchId.trim() || !addDonorId || !addVolume || !addCollectedAt || !addExpiry) {
      alert("Please fill out all required fields.");
      return;
    }

    let finalLabel = "Pending QC";
    if (addStatus === "verified") finalLabel = "Verified";
    else if (addStatus === "fail") finalLabel = "Failed";
    else if (addStatus === "neutral") finalLabel = "Neutral";

    try {
      const { error } = await supabase
        .from("inventory_batches")
        .insert([{
          batch_id: addBatchId.trim(),
          donor_id: addDonorId,
          volume_ml: Number(addVolume),
          collected_at: new Date(addCollectedAt).toISOString(),
          expiry_date: addExpiry,
          lab_status: addStatus,
          lab_label: finalLabel,
          storage_location: addStorage.trim() || null
        }]);

      if (error) throw error;

      alert(`Success! Created batch: ${addBatchId}`);
      setIsAddModalOpen(false);
      // Reset form
      setAddBatchId("");
      setAddDonorId("");
      setAddVolume("");
      setAddCollectedAt("");
      setAddExpiry("");
      setAddStatus("pending");
      setAddStorage("");
      // Reload inventory data
      loadData();
      setHistoryRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error adding batch: " + err.message);
    }
  };

  const openEditModal = (batch: any) => {
    setEditingBatch(batch);
    setEditVolume(String(batch.volumeMl));
    setEditExpiry(batch.rawExpiry || "");
    setEditStorage(batch.storage === "N/A" ? "" : batch.storage);
    setEditStatus(batch.labStatus);
    setEditLabel(batch.labLabel);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    let finalLabel = editLabel;
    if (editStatus !== editingBatch.labStatus && editLabel === editingBatch.labLabel) {
      if (editStatus === "verified") finalLabel = "Verified";
      else if (editStatus === "fail") finalLabel = "Failed";
      else if (editStatus === "pending") finalLabel = "Pending QC";
      else if (editStatus === "neutral") finalLabel = "Neutral";
    }

    try {
      const { error } = await supabase
        .from("inventory_batches")
        .update({
          volume_ml: Number(editVolume),
          expiry_date: editExpiry,
          storage_location: editStorage || null,
          lab_status: editStatus,
          lab_label: finalLabel
        })
        .eq("batch_id", editingBatch.batchId);

      if (error) throw error;

      alert("Batch updated successfully!");
      setIsEditModalOpen(false);
      loadData();
      setHistoryRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      alert("Error updating batch: " + err.message);
    }
  };

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

  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage) || 1;
  const paginatedBatches = filteredBatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AppShell activeSlug="inventory-lab-results">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-on-surface">Inventory Management</h2>
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

          <div className="mb-8">
            <InventoryHistoryTable key={historyRefreshKey} />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-on-surface">Current Donations</h3>
            <div className="flex gap-2 relative">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:brightness-95 active:scale-[0.98] transition-all"
              >
                <Icon name="add" />
                New Entry
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${isFilterOpen || selectedStatuses.length > 0 || selectedStorages.length > 0 || minVolume || maxVolume
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
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${isSelected
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
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${isSelected
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
          {isLoadingData ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-12 flex flex-col items-center justify-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm font-semibold text-outline animate-pulse">Loading inventory batches...</p>
            </div>
          ) : (
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
                        "Actions"
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
                        <td colSpan={8} className="px-4 py-8 text-center text-sm font-semibold text-on-surface-variant">
                          No batches match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedBatches.map((batch, index) => (
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
                            <select
                              value={batch.labStatus}
                              onChange={(e) => handleStatusChange(batch.batchId, e.target.value)}
                              className="px-2 py-1 text-xs border border-outline-variant rounded bg-white text-on-surface outline-none font-semibold focus:border-primary cursor-pointer"
                            >
                              <option value="pending">Pending QC</option>
                              <option value="verified">Verified</option>
                              <option value="fail">Failed</option>
                              <option value="neutral">Neutral</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 font-semibold text-on-surface-variant">{batch.storage}</td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(batch)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-bold hover:bg-primary/5 cursor-pointer active:scale-95 transition-all"
                            >
                              <Icon name="edit" className="text-xs" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(batch)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-error text-error text-xs font-bold hover:bg-error-container/10 cursor-pointer active:scale-95 transition-all"
                            >
                              <Icon name="delete" className="text-xs" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-outline-variant/30 pt-4 px-4 bg-surface-container-low rounded-b-xl pb-4">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBatches.length)} of {filteredBatches.length} entries
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="p-1 rounded hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <Icon name="chevron_left" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`h-7 w-7 text-xs font-bold rounded-lg transition-all cursor-pointer ${currentPage === page
                          ? "bg-primary text-white"
                          : "hover:bg-surface-container-high text-on-surface"
                          }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="p-1 rounded hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <Icon name="chevron_right" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Batch Modal */}
      {isEditModalOpen && editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-on-background/45 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />

          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
            <div className="bg-primary px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Edit Batch Details</h2>
                <p className="text-primary-fixed/80 text-xs mt-1 font-semibold">
                  Batch: {editingBatch.batchId} ({editingBatch.donor})
                </p>
              </div>
              <button
                type="button"
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
                onClick={() => setIsEditModalOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Volume (mL) *
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm"
                    type="number"
                    required
                    value={editVolume}
                    onChange={(e) => setEditVolume(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Expiry Date *
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm"
                    type="date"
                    required
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Storage Location
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm"
                    type="text"
                    placeholder="e.g. Freezer A-12"
                    value={editStorage}
                    onChange={(e) => setEditStorage(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Lab Status
                    </label>
                    <select
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="pending">Pending QC</option>
                      <option value="verified">Verified</option>
                      <option value="fail">Failed</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Lab Label
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm"
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 border border-outline text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-on-background/45 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
            <div className="bg-primary px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Add New Batch</h2>
                <p className="text-primary-fixed/80 text-xs mt-1 font-semibold">
                  Register a new milk batch in inventory
                </p>
              </div>
              <button
                type="button"
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
                onClick={() => setIsAddModalOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddBatch} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Batch ID *
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm"
                    type="text"
                    required
                    placeholder="e.g. MB-2026-0001"
                    value={addBatchId}
                    onChange={(e) => setAddBatchId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Donor *
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white"
                    required
                    value={addDonorId}
                    onChange={(e) => setAddDonorId(e.target.value)}
                  >
                    <option value="">Select Donor...</option>
                    {donors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.display_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Volume (mL) *
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm"
                      type="number"
                      required
                      placeholder="e.g. 450"
                      value={addVolume}
                      onChange={(e) => setAddVolume(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Storage Location
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm"
                      type="text"
                      placeholder="e.g. Freezer A-12"
                      value={addStorage}
                      onChange={(e) => setAddStorage(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Collected At *
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-xs"
                      type="datetime-local"
                      required
                      value={addCollectedAt}
                      onChange={(e) => setAddCollectedAt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Expiry Date *
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm"
                      type="date"
                      required
                      value={addExpiry}
                      onChange={(e) => setAddExpiry(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Initial Lab Status
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white"
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value)}
                  >
                    <option value="pending">Pending QC</option>
                    <option value="verified">Verified</option>
                    <option value="fail">Failed</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  Create Batch
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 border border-outline text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deletingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-on-background/45 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />

          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
            <div className="bg-error px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Confirm Deletion</h2>
                <p className="text-error-container text-xs mt-1 font-semibold">
                  This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <p className="text-sm text-on-surface-variant font-semibold">
                Are you sure you want to delete the following batch?
              </p>

              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-2 text-sm font-semibold">
                <div><span className="text-outline">Batch ID:</span> <span className="text-on-surface">{deletingBatch.batchId}</span></div>
                <div><span className="text-outline">Donor:</span> <span className="text-on-surface">{deletingBatch.donor}</span></div>
                <div><span className="text-outline">Volume:</span> <span className="text-on-surface">{deletingBatch.volumeMl} ml</span></div>
                <div><span className="text-outline">Storage:</span> <span className="text-on-surface">{deletingBatch.storage}</span></div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleDeleteBatch}
                  className="flex-1 py-3 bg-error text-white font-bold rounded-xl hover:bg-error/95 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  Delete Entry
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 border border-outline text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
