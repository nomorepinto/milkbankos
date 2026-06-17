"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { DonorSubNav } from "@/components/milkbank/layout/DonorSubNav";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import {
  activityLogs,
  donorRows,
} from "@/lib/data/mockData";

export interface DonorDirectoryScreenProps {}

export function DonorDirectoryScreen(_props: Readonly<DonorDirectoryScreenProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("Last Donation (Newest)");
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  // Filter logic
  const filteredRows = donorRows.filter((donor) => {
    const matchesSearch =
      donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.contact.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "Active" && donor.status === "verified") ||
      (statusFilter === "Inactive" && donor.status === "neutral") ||
      (statusFilter === "Flagged" && donor.status === "fail");

    return matchesSearch && matchesStatus;
  });

  // Sorting logic
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortBy === "Donor Name (A-Z)") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "Volume (High to Low)") {
      const volA = parseFloat(a.totalVolume);
      const volB = parseFloat(b.totalVolume);
      return volB - volA;
    }
    // Default: Last Donation (Newest)
    const dateA = new Date(a.lastDonation).getTime();
    const dateB = new Date(b.lastDonation).getTime();
    return dateB - dateA;
  });

  return (
    <AppShell activeSlug="donor-directory">
      <div className="bg-background min-h-screen pb-12">
        <DonorSubNav activeTab="registry" />

        <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-1">
                <Icon name="volunteer_activism" className="text-base" />
                <span>Mom&apos;s Act Module</span>
              </div>
              <h2 className="text-3xl font-bold text-on-surface">Donor Registry &amp; History</h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Management of certified human milk donors and donation cycles.
              </p>
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

          {/* Stats Bento (Quick Clinical Context) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Active Donors"
              value="142"
              icon="group"
              accent="primary"
            />
            <StatCard
              label="Total Vol (Month)"
              value="1,240 L"
              icon="water_drop"
              accent="secondary"
            />
            <StatCard
              label="Pending Certs"
              value="08"
              icon="verified"
              accent="neutral"
            />
            <StatCard
              label="Due Screening"
              value="12"
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                onChange={(e) => setSortBy(e.target.value)}
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
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm font-medium">
                  {sortedRows.length > 0 ? (
                    sortedRows.map((donor, i) => (
                      <tr
                        key={donor.id}
                        className={`hover:bg-surface-container-low/30 transition-colors ${
                          i % 2 === 1 ? "bg-surface-container-low/10" : ""
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
                            className={`flex items-center gap-1 font-bold text-xs ${
                              donor.status === "verified"
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
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            className="px-3 py-1 text-primary hover:bg-primary/5 rounded font-semibold text-xs border border-transparent hover:border-primary/20 transition-colors cursor-pointer"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant/70">
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
                Showing {sortedRows.length} of {donorRows.length} donors
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-surface-container text-outline transition-colors cursor-pointer"
                >
                  <Icon name="chevron_left" />
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded bg-primary text-white text-xs font-semibold"
                >
                  1
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded hover:bg-surface-container text-xs font-semibold text-on-surface cursor-pointer"
                >
                  2
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded hover:bg-surface-container text-xs font-semibold text-on-surface cursor-pointer"
                >
                  3
                </button>
                <span className="px-2 text-outline">...</span>
                <button
                  type="button"
                  className="w-8 h-8 rounded hover:bg-surface-container text-xs font-semibold text-on-surface cursor-pointer"
                >
                  15
                </button>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-surface-container text-outline transition-colors cursor-pointer"
                >
                  <Icon name="chevron_right" />
                </button>
              </div>
            </div>
          </div>

          {/* Asymmetric Bottom Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity Logs */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
                <h3 className="text-lg font-bold text-on-surface">Recent Activity Logs</h3>
                <Icon name="more_vert" className="text-outline cursor-pointer hover:text-primary transition-colors" />
              </div>
              
              <ul className="divide-y divide-outline-variant/10 flex-grow">
                {activityLogs.map((log) => {
                  let logIcon = "add_task";
                  let iconColorClass = "text-secondary bg-secondary-container/20";
                  
                  if (log.message.includes("logged")) {
                    logIcon = "local_shipping";
                    logIcon = "volunteer_activism";
                    iconColorClass = "text-primary bg-primary-container/20";
                  } else if (log.message.includes("flagged") || log.message.includes("alert")) {
                    logIcon = "priority_high";
                    iconColorClass = "text-error bg-error-container/20";
                  }

                  return (
                    <li
                      key={log.id}
                      className="p-4 hover:bg-surface-container-lowest transition-colors flex items-center gap-4"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColorClass}`}>
                        <Icon name={logIcon} className="text-xl" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm text-on-surface font-semibold">{log.message}</p>
                        <p className="text-outline text-xs mt-0.5">{log.time} • System Logged</p>
                      </div>
                      <button
                        type="button"
                        className="text-primary font-bold text-xs hover:underline cursor-pointer"
                      >
                        Details
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Clinical Map Card Overview */}
            <div className="bg-primary/5 rounded-xl p-6 border border-primary-container/20 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-2">Clinical Map Overview</h3>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Real-time visualization of donor concentration and logistics route efficiency. Switch to Map View to manage pickups.
                </p>
                
                {/* Visual Map Representative Widget */}
                <div className="aspect-square bg-white rounded-lg border border-primary-container/20 overflow-hidden relative shadow-inner">
                  <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(106,72,185,0.06)_1px,transparent_1px)] [background-size:20px_20px]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <Icon name="location_on" filled className="text-primary text-[44px]" />
                    <div className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full -mt-2 font-bold shadow-md">
                      142 Donors
                    </div>
                  </div>
                </div>
              </div>
              
              <Link href="/collection-point-logistics">
                <button
                  type="button"
                  className="w-full mt-6 py-3 bg-primary text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <Icon name="explore" />
                  <span>Enter Logistics Interface</span>
                </button>
              </Link>
            </div>
          </div>
          
        </main>
      </div>
    </AppShell>
  );
}
