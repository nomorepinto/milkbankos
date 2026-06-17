import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { collectionPoints } from "@/lib/data/mockData";

export interface CollectionPointLogisticsScreenProps {}

export function CollectionPointLogisticsScreen(_props: Readonly<CollectionPointLogisticsScreenProps>) {
  return (
    <AppShell activeSlug="collection-point-logistics" fullBleed>
      <main className="relative flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="grid flex-1 gap-0 lg:grid-cols-3">
          <div className="relative bg-gradient-to-br from-primary-container/15 to-secondary-container/10 p-6 lg:col-span-2">
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-1 p-6 opacity-20">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="rounded border border-outline-variant/30" />
              ))}
            </div>
            <div className="relative z-10">
              <h1 className="text-2xl font-semibold text-on-surface">Donor Community Map</h1>
              <p className="text-sm text-on-surface-variant">
                Collection point logistics and regional routing overview.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatCard label="Active Points" value="08" icon="location_on" accent="primary" />
                <StatCard label="Volume Today" value="42.5 L" icon="water_drop" accent="secondary" />
                <StatCard label="Routes" value="124" icon="route" accent="neutral" />
              </div>
            </div>
          </div>

          <aside className="custom-scrollbar overflow-y-auto border-l border-outline-variant/30 bg-surface-container-lowest p-6">
            <h2 className="mb-4 text-lg font-semibold">Collection Points</h2>
            <div className="space-y-4">
              {collectionPoints.map((point) => (
                <div
                  key={point.id}
                  className="rounded-xl border border-outline-variant/30 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-on-surface">{point.name}</h4>
                      <p className="text-sm text-on-surface-variant">{point.address}</p>
                    </div>
                    <StatusChip label={point.statusLabel} variant={point.status} />
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <span>
                      <Icon name="groups" className="mr-1 inline text-base text-primary" />
                      {point.activeDonors} donors
                    </span>
                    <span className="tabular-nums">{point.volumeToday}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
