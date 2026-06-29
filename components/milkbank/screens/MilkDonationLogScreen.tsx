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
  const [collectionPoints, setCollectionPoints] = useState<any[]>([]);

  // Modal form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addVolume, setAddVolume] = useState("");
  const [addDonatedAt, setAddDonatedAt] = useState("");
  const [addMilkType, setAddMilkType] = useState("Fresh");
  const [addTemp, setAddTemp] = useState("");
  const [addCollectionPointId, setAddCollectionPointId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

        const { data: donationsData } = await supabase
          .from("donations")
          .select("*")
          .eq("donor_id", donorId)
          .order("donated_at", { ascending: false });

        if (donationsData) {
          const totalVol = donationsData.reduce((sum, d) => sum + Number(d.volume_ml), 0);
          const countThisQuarter = donationsData.filter(d => {
            const dDate = new Date(d.donated_at);
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return dDate >= threeMonthsAgo;
          }).length;

          setStats({
            totalVolume: totalVol.toLocaleString(),
            donations: countThisQuarter.toString(),
            impact: `Nurturing ${Math.max(1, Math.round(totalVol / 1500))} Infants`
          });

          setRows(donationsData.map(d => ({
            id: d.id,
            dateTime: new Date(d.donated_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).replace(',', ' ·'),
            volumeMl: Number(d.volume_ml),
            type: d.milk_type,
            temp: d.temperature_c != null ? `${d.temperature_c}°C` : "N/A",
            status: d.status,
            statusLabel: d.status_label
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

    async function loadCollectionPoints() {
      try {
        const { data } = await supabase
          .from("collection_points")
          .select("id, name")
          .order("name");
        if (data) setCollectionPoints(data);
      } catch (err) {
        console.error("Error loading collection points:", err);
      }
    }
    loadCollectionPoints();
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

  const openAddModal = () => {
    setAddVolume("");
    setAddMilkType("Fresh");
    setAddTemp("");
    setAddCollectionPointId("");
    // set to current local time in YYYY-MM-DDTHH:mm format
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
    setAddDonatedAt(localISOTime);
    setIsAddModalOpen(true);
  };

  const handleSubmitAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDonorId || !addVolume || !addDonatedAt) {
      alert("Please fill out all required fields.");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("donations")
        .insert([{
          donor_id: activeDonorId,
          collection_point_id: addCollectionPointId || null,
          volume_ml: Number(addVolume),
          milk_type: addMilkType,
          temperature_c: addTemp ? Number(addTemp) : null,
          donated_at: new Date(addDonatedAt).toISOString(),
          status: "pending",
          status_label: "Processing"
        }]);

      if (error) throw error;

      alert("Success! Donation logged successfully.");
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Error logging donation: " + err.message);
    } finally {
      setIsSaving(false);
    }
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
                onClick={openAddModal}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
              >
                <Icon name="add" />
                Log Donation
              </button>
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
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm font-semibold text-on-surface-variant">
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Log Donation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-on-background/45 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
            <div className="bg-primary px-8 py-6 text-white flex justify-between items-center bg-primary-dark">
              <div>
                <h2 className="text-xl font-bold">Log New Donation</h2>
                <p className="text-primary-fixed/80 text-xs mt-1 font-semibold text-white/80">
                  Register a new milk donation in the logs
                </p>
              </div>
              <button
                type="button"
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
                onClick={() => setIsAddModalOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddDonation} className="p-8 space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-outline">
                    Donor
                  </label>
                  <input
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container-low outline-none font-semibold text-sm text-on-surface disabled:opacity-70"
                    type="text"
                    disabled
                    value={donorName}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-outline">
                      Volume (mL) *
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white"
                      type="number"
                      required
                      placeholder="e.g. 450"
                      value={addVolume}
                      onChange={(e) => setAddVolume(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-outline">
                      Milk Type *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white text-on-surface"
                      required
                      value={addMilkType}
                      onChange={(e) => setAddMilkType(e.target.value)}
                    >
                      <option value="Fresh">Fresh</option>
                      <option value="Frozen">Frozen</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-outline">
                      Donated At *
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-xs bg-white text-on-surface"
                      type="datetime-local"
                      required
                      value={addDonatedAt}
                      onChange={(e) => setAddDonatedAt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-outline">
                      Temperature (°C)
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white text-on-surface"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 4.2 or -20"
                      value={addTemp}
                      onChange={(e) => setAddTemp(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-outline">
                    Collection Point
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white text-on-surface"
                    value={addCollectionPointId}
                    onChange={(e) => setAddCollectionPointId(e.target.value)}
                  >
                    <option value="">Select Collection Point...</option>
                    {collectionPoints.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-primary-container text-white font-bold rounded-xl hover:brightness-95 transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Log Donation"}
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 border border-outline text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
