"use client";

import { useState } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { terminalSessions } from "@/lib/data/mockData";

export interface OnsiteCollectionTerminalScreenProps {}

export function OnsiteCollectionTerminalScreen(_props: Readonly<OnsiteCollectionTerminalScreenProps>) {
  const [volume, setVolume] = useState("450");

  return (
    <AppShell activeSlug="onsite-collection-terminal">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px] space-y-8">
          <div>
            <h2 className="flex items-center gap-3 text-3xl font-bold text-on-background">
              <Icon name="point_of_sale" className="text-primary" />
              Onsite Collection Terminal
            </h2>
            <p className="text-sm text-on-surface-variant">
              Point-of-collection intake for onsite donor sessions.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <h3 className="mb-4 text-lg font-semibold">Intake Session Details</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    Donor ID / Scan
                  </label>
                  <input
                    className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm"
                    placeholder="Scan badge or enter ID"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-on-surface-variant">
                    Volume (ml)
                  </label>
                  <input
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-sm tabular-nums"
                  />
                </div>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-3 text-sm font-semibold text-white"
                >
                  <Icon name="check_circle" />
                  Confirm Intake
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
              <h3 className="mb-4 text-lg font-semibold">Batch Tracking</h3>
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary-container/5 p-6 text-center">
                <p className="text-sm text-on-surface-variant">Next Batch ID</p>
                <p className="text-2xl font-bold text-primary">MB-2024-0893</p>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
            <h3 className="mb-4 text-lg font-semibold">Today&apos;s Local Session Log</h3>
            <div className="space-y-3">
              {terminalSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-2 rounded-lg border border-outline-variant/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-on-surface">{session.donor}</p>
                    <p className="text-sm text-on-surface-variant">
                      {session.time} · {session.batchId}
                    </p>
                  </div>
                  <span className="text-lg font-semibold tabular-nums text-primary">
                    {session.volumeMl} ml
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
