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
  }, []);

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
  }, [searchQuery, statusFilter, sortBy, currentPage]);

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
                        className={`hover:bg-surface-container-low/30 transition-colors ${i % 2 === 1 ? "bg-surface-container-low/10" : ""
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
    </AppShell>
  );
}
