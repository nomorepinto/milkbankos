import Link from "next/link";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import {
  activityLogs,
  donorDirectoryStats,
  donorRows,
} from "@/lib/data/mockData";

export interface DonorDirectoryScreenProps {}

export function DonorDirectoryScreen(_props: Readonly<DonorDirectoryScreenProps>) {
  return (
    <AppShell activeSlug="donor-directory">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-[1440px] space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-on-surface">
              Donor Registry & History
            </h2>
            <p className="text-sm text-on-surface-variant">
              Mom&apos;s Act — comprehensive donor directory and screening status.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active Donors"
              value={donorDirectoryStats.activeDonors}
              icon="groups"
              accent="primary"
            />
            <StatCard
              label="Total Volume"
              value={donorDirectoryStats.totalVolume}
              icon="water_drop"
              accent="secondary"
            />
            <StatCard
              label="New This Month"
              value={donorDirectoryStats.newThisMonth}
              icon="person_add"
              accent="neutral"
            />
            <StatCard
              label="Due Screening"
              value={donorDirectoryStats.dueScreening}
              icon="event"
              accent="tertiary"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-surface-container-low">
                  <tr>
                    {[
                      "Donor ID",
                      "Name",
                      "Status",
                      "Last Donation",
                      "Total Volume",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donorRows.map((donor, i) => (
                    <tr
                      key={donor.id}
                      className={i % 2 === 0 ? "" : "bg-surface-container-low/50"}
                    >
                      <td className="px-4 py-3 font-medium text-primary">{donor.id}</td>
                      <td className="px-4 py-3">{donor.name}</td>
                      <td className="px-4 py-3">
                        <StatusChip label={donor.statusLabel} variant={donor.status} />
                      </td>
                      <td className="px-4 py-3">{donor.lastDonation}</td>
                      <td className="px-4 py-3">{donor.totalVolume}</td>
                      <td className="px-4 py-3">
                        <button type="button" className="text-primary hover:underline">
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <h3 className="mb-4 text-lg font-semibold">Recent Activity Logs</h3>
              <ul className="space-y-4">
                {activityLogs.map((log) => (
                  <li key={log.id} className="flex gap-3 border-b border-outline-variant/20 pb-3 last:border-0">
                    <Icon name="history" className="text-primary" />
                    <div>
                      <p className="text-sm text-on-surface">{log.message}</p>
                      <p className="text-xs text-on-surface-variant">{log.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl bg-primary-container/15 p-6">
              <h3 className="mb-2 text-lg font-semibold text-primary">Clinical Map Overview</h3>
              <p className="text-sm text-on-surface-variant">
                Geographic distribution of active donors linked to collection points and
                hospital partners across the service region.
              </p>
              <Link
                href="/donor-community-map"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
              >
                Open Community Map
                <Icon name="arrow_forward" />
              </Link>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
