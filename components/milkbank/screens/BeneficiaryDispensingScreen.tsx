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
  ward: string;
  volumeMl: number;
  date: string;
  priority: string;
  status: any;
  statusLabel: string;
}

interface BeneficiaryOption {
  id: string;
  infant_name: string;
}

export function BeneficiaryDispensingScreen(_props: Readonly<BeneficiaryDispensingScreenProps>) {
  const [records, setRecords] = useState<DispensingRecord[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryOption[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
        .select("*, beneficiary:beneficiaries(infant_name)");

      if (data) {
        setRecords(data.map((r: any) => ({
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
    } catch (err) {
      console.error("Error loading dispensing records:", err);
    }
  };

  const loadBeneficiaries = async () => {
    try {
      const { data } = await supabase
        .from("beneficiaries")
        .select("id, infant_name")
        .order("infant_name");
      if (data) {
        setBeneficiaries(data as BeneficiaryOption[]);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDispensing();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBeneficiaries();
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

  const critical = records.filter((r) => r.priority === "critical");

  const isFormComplete =
    !!selectedBeneficiaryId &&
    !!ward.trim() &&
    !!volumeMl &&
    !!date &&
    !!status;

  return (
    <AppShell activeSlug="beneficiary-dispensing">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px] space-y-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-on-surface">Dispensing Records</h2>
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

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-on-surface">NICU Monitoring Flow</h2>
          </div>

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
                  ))}
                </tbody>
              </table>
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
      </main>

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
