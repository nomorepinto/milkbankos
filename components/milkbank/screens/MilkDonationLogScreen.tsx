import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { donationLogStats, donationRows } from "@/lib/data/mockData";

export interface MilkDonationLogScreenProps {}

export function MilkDonationLogScreen(_props: Readonly<MilkDonationLogScreenProps>) {
  return (
    <AppShell activeSlug="milk-donation-log">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Donor Portal
              </p>
              <h2 className="text-3xl font-bold text-on-surface">Donation History</h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Icon name="add" />
              Log New Donation
            </button>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Volume"
              value={donationLogStats.totalVolume}
              subtext="ml lifetime"
              icon="water_drop"
              accent="primary"
            />
            <StatCard
              label="Donations"
              value={donationLogStats.donations}
              subtext="This quarter"
              icon="history"
              accent="secondary"
            />
            <StatCard
              label="Impact"
              value={donationLogStats.impact}
              icon="favorite"
              accent="tertiary"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-outline-variant/30 bg-surface-container-low">
                  <tr>
                    {["Date & Time", "Volume (ml)", "Type", "Temp", "Status", "Actions"].map(
                      (header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-on-surface"
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {donationRows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={
                        index % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface-container-low/50"
                      }
                    >
                      <td className="px-6 py-4 text-on-surface">{row.dateTime}</td>
                      <td className="px-6 py-4 font-medium tabular-nums">{row.volumeMl}</td>
                      <td className="px-6 py-4">{row.type}</td>
                      <td className="px-6 py-4 tabular-nums">{row.temp}</td>
                      <td className="px-6 py-4">
                        <StatusChip label={row.statusLabel} variant={row.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" className="text-primary hover:underline">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
