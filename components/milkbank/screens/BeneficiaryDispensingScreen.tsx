"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { supabase } from "@/lib/supabaseClient";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BeneficiaryDispensingScreenProps { }

interface DispensingRecord {
  id: string;
  beneficiary: string;
  beneficiaryStatus: string;
  ward: string;
  volumeMl: number;
  date: string;
  priority: string;
  status: any;
  statusLabel: string;
}

interface BeneficiaryRecord {
  id: string;
  infant_name: string;
  date_of_birth?: string;
  gestational_age?: string;
  medical_record_number?: string;
  hospital_name?: string;
  attending_physician?: string;
  ward?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_contact?: string;
  daily_volume_ml?: number;
  feeding_frequency?: string;
  special_instructions?: string;
  status?: "healthy" | "critical";
}

export function BeneficiaryDispensingScreen(_props: Readonly<BeneficiaryDispensingScreenProps>) {
  const [records, setRecords] = useState<DispensingRecord[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryRecord[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dispensing" | "beneficiary">("dispensing");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form States
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("");
  const [ward, setWard] = useState("");
  const [volumeMl, setVolumeMl] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDispensing = async () => {
    try {
      const { data } = await supabase
        .from("dispensing_records")
        .select("*, beneficiary:beneficiaries(infant_name, status)");

      if (data) {
        setRecords(data.map((r: any) => ({
          id: r.id,
          beneficiary: r.beneficiary?.infant_name || "Unknown",
          beneficiaryStatus: r.beneficiary?.status || "healthy",
          ward: r.ward,
          volumeMl: Number(r.volume_ml),
          date: r.dispensed_date,
          priority: r.priority,
          status: r.status,
          statusLabel: r.status_label
        })));
      }
    } catch (err) {
      console.error("Error loading dispensing records:", err);
    }
  };

  const loadBeneficiaries = async () => {
    try {
      const { data } = await supabase
        .from("beneficiaries")
        .select("*")
        .order("infant_name");
      if (data) {
        setBeneficiaries(data as BeneficiaryRecord[]);
      }
    } catch (err) {
      console.error("Error loading beneficiaries:", err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    let statusLabel = "Scheduled";
    if (newStatus === "verified") statusLabel = "Dispensed";
    else if (newStatus === "fail") statusLabel = "Failed";
    else if (newStatus === "neutral") statusLabel = "Neutral";

    try {
      const { error } = await supabase
        .from("dispensing_records")
        .update({ status: newStatus, status_label: statusLabel })
        .eq("id", id);

      if (error) throw error;

      setRecords((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: newStatus, statusLabel: statusLabel } : r
        )
      );
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const handlePriorityChange = async (id: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from("dispensing_records")
        .update({ priority: newPriority })
        .eq("id", id);

      if (error) throw error;

      setRecords((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, priority: newPriority } : r
        )
      );
    } catch (err: any) {
      alert("Error updating priority: " + err.message);
    }
  };

  useEffect(() => {
    async function loadAllData() {
      setIsLoadingData(true);
      await Promise.all([loadDispensing(), loadBeneficiaries()]);
      setIsLoadingData(false);
    }
    loadAllData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeneficiaryId || !ward.trim() || !volumeMl || !date || !status) {
      alert("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedId = "DISP-" + Math.floor(1000 + Math.random() * 9000);
      let statusLabel = "Scheduled";
      if (status === "verified") statusLabel = "Dispensed";
      else if (status === "fail") statusLabel = "Failed";
      else if (status === "neutral") statusLabel = "Neutral";

      const payload = {
        id: generatedId,
        beneficiary_id: selectedBeneficiaryId,
        ward: ward.trim(),
        volume_ml: Number(volumeMl),
        dispensed_date: date,
        priority: priority,
        status: status,
        status_label: statusLabel,
      };

      const { error } = await supabase.from("dispensing_records").insert([payload]);
      if (error) {
        throw error;
      }

      alert(`Success! Created Dispensing Record: ${generatedId}`);
      setIsAddModalOpen(false);
      // Reset form states
      setSelectedBeneficiaryId("");
      setWard("");
      setVolumeMl("");
      setDate("");
      setStatus("pending");
      setPriority("standard");
      // Reload list
      loadDispensing();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Error creating dispensing record: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(query) ||
      r.beneficiary.toLowerCase().includes(query) ||
      r.ward.toLowerCase().includes(query) ||
      String(r.volumeMl).toLowerCase().includes(query) ||
      r.date.toLowerCase().includes(query) ||
      r.statusLabel.toLowerCase().includes(query)
    );
  });

  const critical = filteredRecords.filter(
    (r) => r.beneficiaryStatus === "critical" && r.status === "pending"
  );

  const isFormComplete =
    !!selectedBeneficiaryId &&
    !!ward.trim() &&
    !!volumeMl &&
    !!date &&
    !!status;

  const renderBeneficiaryTable = (list: BeneficiaryRecord[], isCritical: boolean) => {
    return (
      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm text-on-surface">
            <thead className="bg-surface-container-low">
              <tr>
                {[
                  "Infant Name",
                  "MRN",
                  "DOB",
                  "Gestational Age",
                  "Hospital/NICU",
                  "Ward/Room",
                  "Attending Physician",
                  "Daily Volume",
                  "Guardian Info",
                  "Special Instructions"
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-on-surface-variant/70 font-semibold">
                    No {isCritical ? "critical care" : "healthy"} infants registered.
                  </td>
                </tr>
              ) : (
                list.map((b, i) => (
                  <tr
                    key={b.id}
                    className={i % 2 === 0 ? "" : "bg-surface-container-low/50"}
                  >
                    <td className="px-4 py-3 font-semibold text-on-surface whitespace-nowrap">{b.infant_name}</td>
                    <td className="px-4 py-3 font-medium text-primary tabular-nums whitespace-nowrap">{b.medical_record_number || "N/A"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{b.date_of_birth || "N/A"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{b.gestational_age || "N/A"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{b.hospital_name || "N/A"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{b.ward || "N/A"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{b.attending_physician || "N/A"}</td>
                    <td className="px-4 py-3 font-bold text-secondary tabular-nums whitespace-nowrap">
                      {b.daily_volume_ml ? `${b.daily_volume_ml} ml` : "N/A"} ({b.feeding_frequency || "N/A"})
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs">
                        <p className="font-bold text-on-surface">{b.guardian_name || "N/A"}</p>
                        <p className="text-outline">{b.guardian_contact || "N/A"} ({b.guardian_relationship || "N/A"})</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant max-w-[200px] truncate" title={b.special_instructions}>
                      {b.special_instructions || "None"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AppShell activeSlug="beneficiary-dispensing">
      <div className="bg-background min-h-screen pb-12">

        <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 space-y-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-bold text-on-surface">Beneficiary &amp; Dispensing Portal</h2>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-outline-variant/30 gap-6">
            <button
              onClick={() => {
                setActiveTab("dispensing");
                setSearchQuery("");
              }}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "dispensing"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
                }`}
            >
              Dispensing Records
            </button>
            <button
              onClick={() => {
                setActiveTab("beneficiary");
                setSearchQuery("");
              }}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "beneficiary"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
                }`}
            >
              Beneficiary List
            </button>
          </div>

          {/* Search Bar */}
          {!isLoadingData && (
            <div className="relative max-w-md w-full">
              <Icon
                name="search"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                type="text"
                placeholder={
                  activeTab === "dispensing"
                    ? "Search dispensing records (ID, name, ward, date)..."
                    : "Search beneficiaries (name, MRN, NICU, guardian)..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm text-on-surface placeholder-outline-variant/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-outline hover:text-on-surface rounded-full transition-colors cursor-pointer"
                >
                  <Icon name="close" className="text-sm" />
                </button>
              )}
            </div>
          )}

          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm font-semibold text-outline animate-pulse">Loading portal data...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Dispensing Records */}
              {activeTab === "dispensing" && (
                <div className="space-y-8">
              {critical.length > 0 && (
                <div className="rounded-xl border border-tertiary/30 bg-tertiary/5 p-6">
                  <h4 className="text-lg font-semibold text-tertiary">
                    Critical Priority: Premature Infants
                  </h4>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {critical.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 relative group"
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
              )}

              <div>
                <h3 className="text-xl font-bold text-on-surface mb-4">NICU Monitoring Flow</h3>
                <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-surface-container-low">
                        <tr>
                          {["Record ID", "Beneficiary", "Ward", "Volume", "Date", "Status", "Change Status"].map(
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
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant/70 font-semibold">
                              No matching dispensing records found.
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((record, i) => (
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
                              <td className="px-4 py-3">
                                <select
                                  value={record.status}
                                  onChange={(e) => handleStatusChange(record.id, e.target.value)}
                                  className="px-2 py-1 text-xs border border-outline-variant rounded bg-white text-on-surface outline-none font-semibold focus:border-primary cursor-pointer"
                                >
                                  <option value="pending">Scheduled</option>
                                  <option value="verified">Dispensed</option>
                                  <option value="fail">Failed</option>
                                  <option value="neutral">Neutral</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-sm font-semibold text-white cursor-pointer hover:brightness-95 active:scale-[0.98]"
                >
                  <Icon name="add" />
                  New Dispensing Record
                </button>
                <Link
                  href="/beneficiary-registration"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 cursor-pointer"
                >
                  <Icon name="person_add" />
                  Register New Beneficiary
                </Link>
              </div>
            </div>
          )}

          {/* Tab 2: Beneficiary List */}
          {activeTab === "beneficiary" && (() => {
            const filteredBeneficiaries = beneficiaries.filter((b) => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase();
              return (
                b.infant_name.toLowerCase().includes(query) ||
                (b.medical_record_number || "").toLowerCase().includes(query) ||
                (b.date_of_birth || "").toLowerCase().includes(query) ||
                (b.gestational_age || "").toLowerCase().includes(query) ||
                (b.hospital_name || "").toLowerCase().includes(query) ||
                (b.ward || "").toLowerCase().includes(query) ||
                (b.attending_physician || "").toLowerCase().includes(query) ||
                String(b.daily_volume_ml || "").toLowerCase().includes(query) ||
                (b.feeding_frequency || "").toLowerCase().includes(query) ||
                (b.guardian_name || "").toLowerCase().includes(query) ||
                (b.guardian_contact || "").toLowerCase().includes(query) ||
                (b.guardian_relationship || "").toLowerCase().includes(query) ||
                (b.special_instructions || "").toLowerCase().includes(query)
              );
            });
            const criticalCare = filteredBeneficiaries.filter(b => b.status === "critical");
            const healthy = filteredBeneficiaries.filter(b => b.status === "healthy" || !b.status);
            return (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-on-surface">Registered Beneficiaries</h3>
                  <Link
                    href="/beneficiary-registration"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-sm font-semibold text-white cursor-pointer hover:brightness-95 active:scale-[0.98]"
                  >
                    <Icon name="person_add" />
                    Register New Beneficiary
                  </Link>
                </div>

                {/* Critical Care Table */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-error flex items-center gap-2">
                    <Icon name="warning" className="text-base" />
                    Critical Care Infants ({criticalCare.length})
                  </h4>
                  {renderBeneficiaryTable(criticalCare, true)}
                </div>

                {/* Healthy / Standard Table */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-secondary flex items-center gap-2">
                    <Icon name="verified" className="text-base" />
                    Healthy / Standard Infants ({healthy.length})
                  </h4>
                  {renderBeneficiaryTable(healthy, false)}
                </div>
              </div>
            );
          })()}
            </>
          )}
        </main>
      </div>

      {/* New Dispensing Record Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-on-background/45 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
            <div className="bg-primary px-8 py-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">New Dispensing Record</h2>
                <p className="text-primary-fixed/80 text-xs mt-1 font-semibold">
                  Record patient milk dispensing transaction
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

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Beneficiary *
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold bg-surface-container-low text-on-surface"
                    value={selectedBeneficiaryId}
                    required
                    onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                  >
                    <option value="">Select Beneficiary...</option>
                    {beneficiaries.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.infant_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Ward *
                  </label>
                  <input
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold bg-surface-container-low text-on-surface"
                    type="text"
                    required
                    placeholder="e.g. NICU-3A"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Volume (mL) *
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold bg-surface-container-low text-on-surface"
                      type="number"
                      required
                      placeholder="150"
                      value={volumeMl}
                      onChange={(e) => setVolumeMl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Date *
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold bg-surface-container-low text-on-surface"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Status *
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold bg-surface-container-low text-on-surface"
                      value={status}
                      required
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="pending">Scheduled (Pending)</option>
                      <option value="verified">Dispensed (Verified)</option>
                      <option value="fail">Failed</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Priority *
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold bg-surface-container-low text-on-surface"
                      value={priority}
                      required
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="standard">Standard</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormComplete}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Record"}
                </button>
                <button
                  type="button"
                  className="flex-1 py-4 border border-outline text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
