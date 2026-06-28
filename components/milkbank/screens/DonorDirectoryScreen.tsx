"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { DonorSubNav } from "@/components/milkbank/layout/DonorSubNav";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { supabase } from "@/lib/supabaseClient";

export interface DonorRow {
  id: string;
  name: string;
  status: any;
  statusLabel: string;
  lastDonation: string;
  totalVolume: string;
  screeningDue: boolean;
  contact: string;
  cycles: number;
  verification: string;
  avatarUrl: string;
}

export interface DonorDirectoryScreenProps { }

const STATUS_OPTIONS = [
  { value: "verified", label: "Active" },
  { value: "neutral", label: "Inactive" },
  { value: "fail", label: "Flagged" },
  { value: "pending", label: "Pending" },
];

export function DonorDirectoryScreen(_props: Readonly<DonorDirectoryScreenProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("Last Donation (Newest)");
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  const [donors, setDonors] = useState<DonorRow[]>([]);
  const [stats, setStats] = useState({
    activeDonors: "0",
    totalVolume: "0 L",
    newThisMonth: "00",
    dueScreening: "0",
  });
  const [logs, setLogs] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedDonor, setSelectedDonor] = useState<DonorRow | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editVerification, setEditVerification] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectDonor = (donor: DonorRow) => {
    setSelectedDonor(donor);
    setEditStatus(donor.status);
    setEditVerification(donor.verification);
  };

  const handleSaveChanges = async () => {
    if (!selectedDonor) return;
    setIsUpdating(true);
    try {
      const selectedOption = STATUS_OPTIONS.find(opt => opt.value === editStatus);
      const statusLabel = selectedOption ? selectedOption.label : "Pending";

      const { error } = await supabase
        .from("donor_profiles")
        .update({
          status: editStatus,
          status_label: statusLabel,
          verification_note: editVerification,
        })
        .eq("display_id", selectedDonor.id);

      if (error) throw error;

      // Add activity log
      await supabase.from("activity_logs").insert({
        message: `Updated status of donor ${selectedDonor.name} (${selectedDonor.id}) to ${statusLabel}`,
      });

      setSelectedDonor(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error updating donor:", err);
      alert("Failed to update donor information.");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    async function loadStatsAndLogs() {
      try {
        const { data: dbStats } = await supabase
          .from("view_donor_directory_stats")
          .select("*")
          .single();

        if (dbStats) {
          setStats({
            activeDonors: String(dbStats.active_donors),
            totalVolume: `${(dbStats.total_volume_ml / 1000).toFixed(0)} L`,
            newThisMonth: String(dbStats.new_this_month).padStart(2, '0'),
            dueScreening: String(dbStats.due_screening)
          });
        }

        const { data: dbLogs } = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbLogs) {
          setLogs(dbLogs.map(l => ({
            id: l.id,
            message: l.message,
            time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        }
      } catch (err) {
        console.error("Error loading stats/logs:", err);
      }
    }
    loadStatsAndLogs();
  }, [refreshTrigger]);

  useEffect(() => {
    async function fetchDonors() {
      try {
        let query = supabase
          .from("donor_profiles")
          .select("*", { count: "exact" });

        if (searchQuery.trim()) {
          query = query.or(`full_name.ilike.%${searchQuery}%,display_id.ilike.%${searchQuery}%,contact_phone.ilike.%${searchQuery}%`);
        }

        if (statusFilter) {
          const mappedStatus = statusFilter === "Active" ? "verified" : statusFilter === "Inactive" ? "neutral" : "fail";
          query = query.eq("status", mappedStatus);
        }

        if (sortBy === "Donor Name (A-Z)") {
          query = query.order("full_name", { ascending: true });
        } else if (sortBy === "Volume (High to Low)") {
          query = query.order("total_volume_ml", { ascending: false });
        } else {
          query = query.order("last_donation_at", { ascending: false, nullsFirst: false });
        }

        const from = (currentPage - 1) * 10;
        const to = currentPage * 10 - 1;
        query = query.range(from, to);

        const { data: dbDonors, count, error } = await query;
        if (error) throw error;

        if (dbDonors) {
          setDonors(dbDonors.map(d => ({
            id: d.display_id,
            name: d.full_name,
            status: d.status,
            statusLabel: d.status_label,
            lastDonation: d.last_donation_at || "N/A",
            totalVolume: `${(d.total_volume_ml / 1000).toFixed(1)} L`,
            screeningDue: d.screening_due,
            contact: d.contact_phone || "N/A",
            cycles: d.donation_cycles,
            verification: d.verification_note || "N/A",
            avatarUrl: d.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
          })));
        }
        if (count !== null) {
          setTotalCount(count);
        }
      } catch (err) {
        console.error("Error fetching donors:", err);
      }
    }
    fetchDonors();
  }, [searchQuery, statusFilter, sortBy, currentPage, refreshTrigger]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const donorId = params.get("donorId");
    if (donorId) {
      async function loadHighlightedDonor() {
        const { data, error } = await supabase
          .from("donor_profiles")
          .select("*")
          .eq("display_id", donorId)
          .single();

        if (data && !error) {
          const row: DonorRow = {
            id: data.display_id,
            name: data.full_name,
            status: data.status,
            statusLabel: data.status_label,
            lastDonation: data.last_donation_at || "N/A",
            totalVolume: `${(data.total_volume_ml / 1000).toFixed(1)} L`,
            screeningDue: data.screening_due,
            contact: data.contact_phone || "N/A",
            cycles: data.donation_cycles,
            verification: data.verification_note || "N/A",
            avatarUrl: data.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
          };
          setSelectedDonor(row);
          setEditStatus(row.status);
          setEditVerification(row.verification);
        }
      }
      loadHighlightedDonor();
    }
  }, []);

  const totalPages = Math.ceil(totalCount / 10);

  return (
    <AppShell activeSlug="donor-directory">
      <div className="bg-background min-h-screen pb-12">
        <DonorSubNav activeTab="registry" />

        <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 space-y-8">

          {/* Header Section */}
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-on-surface">Donor Registry &amp; History</h2>
            </div>

            <div className="flex gap-3">
              <Link href="/donor-community-map">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 border border-primary text-primary font-semibold text-sm rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Icon name="map" />
                  <span>Switch to Map View</span>
                </button>
              </Link>
              <Link href="/donor-registration">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary/95 transition-shadow cursor-pointer"
                >
                  <Icon name="person_add" />
                  <span>Register New Donor</span>
                </button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Active Donors"
              value={stats.activeDonors}
              icon="group"
              accent="primary"
            />
            <StatCard
              label="Total Vol (Month)"
              value={stats.totalVolume}
              icon="water_drop"
              accent="secondary"
            />
            <StatCard
              label="Pending Certs"
              value={stats.newThisMonth}
              icon="verified"
              accent="neutral"
            />
            <StatCard
              label="Due Screening"
              value={stats.dueScreening}
              icon="warning"
              accent="tertiary"
            />
          </div>

          {/* Filter Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-t-xl p-4 flex flex-wrap items-center justify-between gap-4 border-b-0">
            <div className="flex items-center gap-3 flex-grow max-w-md">
              <div className="relative w-full">
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary placeholder:text-on-surface-variant/65"
                  placeholder="Search donor name, ID, or contact..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-sm font-semibold text-on-surface border border-outline-variant/50 hover:bg-surface-container-highest cursor-pointer whitespace-nowrap"
                  onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                >
                  <Icon name="filter_list" className="text-lg" />
                  <span>{statusFilter ? `Status: ${statusFilter}` : "Filters"}</span>
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
                        setStatusFilter(null);
                        setShowFiltersDropdown(false);
                        setCurrentPage(1);
                      }}
                    >
                      All Statuses
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-container-low transition-colors"
                      onClick={() => {
                        setStatusFilter("Active");
                        setShowFiltersDropdown(false);
                        setCurrentPage(1);
                      }}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-container-low transition-colors"
                      onClick={() => {
                        setStatusFilter("Inactive");
                        setShowFiltersDropdown(false);
                        setCurrentPage(1);
                      }}
                    >
                      Inactive
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-container-low transition-colors"
                      onClick={() => {
                        setStatusFilter("Flagged");
                        setShowFiltersDropdown(false);
                        setCurrentPage(1);
                      }}
                    >
                      Flagged
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-outline">Sort by:</span>
              <select
                className="bg-transparent text-sm text-on-surface border-none outline-none focus:ring-0 font-semibold cursor-pointer"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="Last Donation (Newest)">Last Donation (Newest)</option>
                <option value="Volume (High to Low)">Volume (High to Low)</option>
                <option value="Donor Name (A-Z)">Donor Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-b-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface">Donor Name</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface">Contact</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface">Total Volume</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface">Donation Count</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface">Last Donation</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm font-medium">
                  {donors.length > 0 ? (
                    donors.map((donor, i) => (
                      <tr
                        key={donor.id}
                        onClick={() => handleSelectDonor(donor)}
                        className={`hover:bg-surface-container-low/30 transition-colors cursor-pointer ${i % 2 === 1 ? "bg-surface-container-low/10" : ""
                          }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              alt={donor.name}
                              className="w-8 h-8 rounded-full object-cover bg-surface-container-high border border-outline-variant/40"
                              src={donor.avatarUrl}
                            />
                            <div>
                              <div className="font-bold text-on-surface">{donor.name}</div>
                              <div className="text-outline text-[11px]">ID: {donor.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">{donor.contact}</td>
                        <td className="px-6 py-4 font-bold text-on-surface">{donor.totalVolume}</td>
                        <td className="px-6 py-4">{donor.cycles} Cycles</td>
                        <td className="px-6 py-4 text-on-surface-variant">{donor.lastDonation}</td>
                        <td className="px-6 py-4">
                          <StatusChip label={donor.statusLabel} variant={donor.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`flex items-center gap-1 font-bold text-xs ${donor.status === "verified"
                              ? "text-secondary"
                              : donor.status === "neutral"
                                ? "text-primary"
                                : "text-error"
                              }`}
                          >
                            <Icon
                              name={
                                donor.status === "verified"
                                  ? "verified"
                                  : donor.status === "neutral"
                                    ? "pending"
                                    : "warning"
                              }
                              filled={donor.status === "verified"}
                              className="text-base"
                            />
                            <span>{donor.verification}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant/70">
                        No donors found matching the query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant/30 flex items-center justify-between">
              <div className="text-on-surface-variant text-xs font-semibold">
                Showing {donors.length} of {totalCount} donors
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-surface-container text-outline transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_left" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded text-xs font-semibold cursor-pointer ${
                      currentPage === p
                        ? "bg-primary text-white"
                        : "hover:bg-surface-container text-on-surface"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded hover:bg-surface-container text-outline transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_right" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <h3 className="text-xl font-bold text-on-surface">Donor Profile Details</h3>
              <button
                type="button"
                onClick={() => setSelectedDonor(null)}
                className="p-1 rounded-full hover:bg-surface-container text-outline transition-colors cursor-pointer"
              >
                <Icon name="close" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-16rem)]">
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-container-low/30 p-4 rounded-xl border border-outline-variant/10">
                <img
                  alt={selectedDonor.name}
                  className="w-16 h-16 rounded-full object-cover bg-surface-container-high border-2 border-primary/20"
                  src={selectedDonor.avatarUrl}
                />
                <div className="text-center sm:text-left flex-grow">
                  <h4 className="text-lg font-bold text-on-surface">{selectedDonor.name}</h4>
                  <div className="text-outline text-xs mt-0.5">ID: {selectedDonor.id}</div>
                  <div className="text-on-surface-variant text-sm mt-1">{selectedDonor.contact}</div>
                  <div className="mt-2">
                    <Link
                      href={`/donor-community-map?donorId=${selectedDonor.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <Icon name="map" className="text-sm" />
                      <span>View on Map</span>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                  <div className="bg-surface-container-high px-3 py-1.5 rounded-lg text-center">
                    <div className="text-xs text-outline font-semibold">Total Volume</div>
                    <div className="text-sm font-bold text-on-surface">{selectedDonor.totalVolume}</div>
                  </div>
                  <div className="bg-surface-container-high px-3 py-1.5 rounded-lg text-center">
                    <div className="text-xs text-outline font-semibold">Cycles</div>
                    <div className="text-sm font-bold text-on-surface">{selectedDonor.cycles}</div>
                  </div>
                </div>
              </div>

              {/* Status and Details Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 space-y-2">
                  <div className="text-xs font-bold text-outline uppercase tracking-wider">Registry Info</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Last Donation:</span>
                      <span className="font-semibold text-on-surface">{selectedDonor.lastDonation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Screening Due:</span>
                      <span className="font-semibold text-on-surface">
                        {selectedDonor.screeningDue ? (
                          <span className="text-error flex items-center gap-1">
                            <Icon name="warning" className="text-sm" /> Yes
                          </span>
                        ) : (
                          <span className="text-secondary flex items-center gap-1">
                            <Icon name="check_circle" className="text-sm" /> No
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 space-y-2">
                  <div className="text-xs font-bold text-outline uppercase tracking-wider">Current Verification</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Status Chip:</span>
                      <StatusChip label={selectedDonor.statusLabel} variant={selectedDonor.status} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-on-surface-variant">Verification Note:</span>
                      <span className="font-semibold text-on-surface">{selectedDonor.verification}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/30">
                <h5 className="text-sm font-bold text-on-surface uppercase tracking-wider">Edit Status &amp; Verification</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-outline">Verification Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary font-semibold"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-outline">Verification Note</label>
                    <input
                      type="text"
                      value={editVerification}
                      onChange={(e) => setEditVerification(e.target.value)}
                      placeholder="e.g. Verified, Pending Re-cert, Flagged"
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-low">
              <button
                type="button"
                onClick={() => setSelectedDonor(null)}
                className="px-4 py-2 border border-outline text-outline font-semibold text-sm rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveChanges}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary/95 transition-shadow cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Icon name="sync" className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Icon name="save" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
