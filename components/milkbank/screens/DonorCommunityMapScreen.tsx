import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { mapDonors } from "@/lib/data/mockData";

export interface DonorCommunityMapScreenProps {}

export function DonorCommunityMapScreen(_props: Readonly<DonorCommunityMapScreenProps>) {
  return (
    <AppShell activeSlug="donor-community-map" fullBleed>
      <main className="relative flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="relative flex-1 bg-gradient-to-br from-secondary-container/20 via-background to-primary-container/10">
          <div className="absolute inset-0 opacity-30">
            <div className="grid h-full w-full grid-cols-6 grid-rows-4 gap-1 p-8">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded border border-outline-variant/20 bg-surface-container-lowest/40"
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 flex h-full flex-col gap-4 p-4 md:flex-row md:p-6">
            <aside className="w-full shrink-0 space-y-3 md:w-80">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                Regional Activity
              </h4>
              {mapDonors.map((donor) => (
                <div
                  key={donor.name}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest/95 p-4 backdrop-blur"
                >
                  <p className="font-semibold text-on-surface">{donor.name}</p>
                  <p className="text-sm text-on-surface-variant">{donor.area}</p>
                  <div className="mt-2">
                    <StatusChip
                      label={
                        donor.status === "verified"
                          ? "Active"
                          : donor.status === "pending"
                            ? "Pending"
                            : "New"
                      }
                      variant={donor.status}
                    />
                  </div>
                </div>
              ))}
            </aside>

            <div className="flex flex-1 flex-col justify-end">
              <div className="mx-auto mb-4 flex flex-wrap gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/95 p-4 backdrop-blur">
                <button type="button" className="rounded-lg bg-primary-container px-3 py-2 text-sm font-semibold text-white">
                  <Icon name="my_location" className="mr-1 inline text-base" />
                  Center Map
                </button>
                <button type="button" className="rounded-lg border border-outline-variant px-3 py-2 text-sm">
                  Filter by Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
