"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { StatusChip } from "@/components/milkbank/ui/StatusChip";
import { supabase } from "@/lib/supabaseClient";

export interface MilkDonationLogScreenProps { }

export function MilkDonationLogScreen(_props: Readonly<MilkDonationLogScreenProps>) {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [stats, setStats] = useState({
    totalVolume: "0",
    donations: "0",
    impact: "Nurturing 0 Infants",
  });

  const [activeDonorId, setActiveDonorId] = useState<string | null>(null);
  const [donorName, setDonorName] = useState("");

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let donorId: string | null = null;

      if (user) {
        // Map auth.users.id to public.users.id
        const { data: dbUser } = await supabase
          .from("users")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (dbUser) {
          donorId = dbUser.id;
        }
      }

      // Check fallback user from localStorage if no active Supabase Auth user
      if (!donorId && typeof window !== "undefined") {
        const storedUserStr = localStorage.getItem("sb_fallback_user");
        if (storedUserStr) {
          try {
            const storedUser = JSON.parse(storedUserStr);
            if (storedUser && storedUser.role === "donor") {
              donorId = storedUser.id;
            }
          } catch (e) {
            console.error("Error parsing stored fallback user", e);
          }
        }
      }

      // Fallback to the first donor profile if no session or fallback exists (for unauthenticated viewing)
      if (!donorId) {
        const { data: profiles } = await supabase.from("donor_profiles").select("id").limit(1);
        if (profiles && profiles.length > 0) {
          donorId = profiles[0].id;
        }
      }

      if (donorId) {
        setActiveDonorId(donorId);

        // Fetch donor profile name
        const { data: profile } = await supabase
          .from("donor_profiles")
          .select("full_name")
          .eq("id", donorId)
          .maybeSingle();

        if (profile?.full_name) {
          setDonorName(profile.full_name);
        } else {
          setDonorName("Mock Donor");
        }

        const { data: batchesData } = await supabase
          .from("inventory_batches")
          .select("*")
          .eq("donor_id", donorId)
          .order("collected_at", { ascending: false });

        if (batchesData) {
          const totalVol = batchesData.reduce((sum, d) => sum + Number(d.volume_ml), 0);
          const countThisQuarter = batchesData.filter(d => {
            const dDate = new Date(d.collected_at);
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return dDate >= threeMonthsAgo;
          }).length;

          setStats({
            totalVolume: totalVol.toLocaleString(),
            donations: countThisQuarter.toString(),
            impact: `Nurturing ${Math.max(1, Math.round(totalVol / 1500))} Infants`
          });

          setRows(batchesData.map(b => ({
            id: b.batch_id,
            dateTime: new Date(b.collected_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).replace(',', ' ·'),
            volumeMl: Number(b.volume_ml),
            storage: b.storage_location || "N/A",
            status: b.lab_status,
            statusLabel: b.lab_label
          })));
        } else {
          setStats({
            totalVolume: "0",
            donations: "0",
            impact: "Nurturing 0 Infants"
          });
          setRows([]);
        }
      }
    } catch (err) {
      console.error("Error loading donations:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error logging out:", err);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("sb_fallback_user");
    }
    window.location.href = "/login";
  };



  return (
    <AppShell activeSlug="milk-donation-log">
      <main className="custom-scrollbar min-h-[calc(100vh-4rem)] overflow-y-auto bg-background p-4 md:p-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-on-surface">Donation History</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-outline px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <Icon name="logout" />
                Log Out
              </button>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Volume"
              value={stats.totalVolume}
              subtext="ml lifetime"
              icon="water_drop"
              accent="primary"
            />
            <StatCard
              label="Donations"
              value={stats.donations}
              subtext="This quarter"
              icon="history"
              accent="secondary"
            />
            <StatCard
              label="Impact"
              value={stats.impact}
              icon="favorite"
              accent="tertiary"
            />
          </div>

          {isLoadingData ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-12 flex flex-col items-center justify-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm font-semibold text-outline animate-pulse">Loading donation history...</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-outline-variant/30 bg-surface-container-low">
                    <tr>
                      {["Date & Time", "Volume (ml)", "Storage Location", "Status", "Actions"].map(
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
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm font-semibold text-on-surface-variant">
                          No donations logged yet.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, index) => (
                        <tr
                          key={row.id}
                          className={
                            index % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface-container-low/50"
                          }
                        >
                          <td className="px-6 py-4 text-on-surface">{row.dateTime}</td>
                          <td className="px-6 py-4 font-medium tabular-nums">{row.volumeMl} mL</td>
                          <td className="px-6 py-4 text-on-surface-variant font-medium">{row.storage}</td>
                          <td className="px-6 py-4">
                            <StatusChip label={row.statusLabel} variant={row.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button type="button" className="text-primary hover:underline">
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
