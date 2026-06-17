import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { inventoryBatches, inventoryStats } from "@/lib/data/mockData";

export interface InventoryLabResultsScreenProps {}

export function InventoryLabResultsScreen(_props: Readonly<InventoryLabResultsScreenProps>) {
  return (
    <AppShell activeSlug="inventory-lab-results">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-on-surface">Inventory Management</h2>
            <p className="text-sm text-on-surface-variant">
              Real-time batch tracking, laboratory results, and cold-chain monitoring.
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Stored Volume"
              value={inventoryStats.totalVolume}
              icon="inventory_2"
              accent="primary"
            />
            <StatCard
              label="Batches Processed"
              value={inventoryStats.batchesToday}
              icon="science"
              accent="secondary"
            />
            <StatCard
              label="Lab Pass Rate"
              value={inventoryStats.passRate}
              icon="verified"
              accent="primary"
            />
            <StatCard
              label="Freezer Temp"
              value={inventoryStats.freezerTemp}
              icon="ac_unit"
              accent="neutral"
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-on-surface">Active Batches</h3>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm"
              >
                <Icon name="filter_list" />
                Filter
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-3 py-2 text-sm font-semibold text-white"
              >
                <Icon name="add" />
                Add Batch
              </button>
            </div>
          </div>

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
                  {inventoryBatches.map((batch, index) => (
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
                        <StatusChip label={batch.labLabel} variant={batch.labStatus} />
                      </td>
                      <td className="px-4 py-3">{batch.storage}</td>
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
