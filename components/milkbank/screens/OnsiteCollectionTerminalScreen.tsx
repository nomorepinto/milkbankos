"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { LogisticsSubNav } from "@/components/milkbank/layout/LogisticsSubNav";
import { Icon } from "@/components/milkbank/ui/Icon";
import { StatCard } from "@/components/milkbank/ui/StatCard";
import { supabase } from "@/lib/supabaseClient";

export interface OnsiteCollectionTerminalScreenProps { }

export function OnsiteCollectionTerminalScreen(_props: Readonly<OnsiteCollectionTerminalScreenProps>) {
  const [batches, setBatches] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [activeHospital, setActiveHospital] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Stat Card states
  const [stats, setStats] = useState({
    totalVolume: "0 ml",
    batchesToday: "0 Today",
    avgTemp: "-18.5 °C",
    activeLocations: "0 Locations",
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addBatchId, setAddBatchId] = useState("");
  const [addHospitalId, setAddHospitalId] = useState("");
  const [addVolume, setAddVolume] = useState("");
  const [addStorage, setAddStorage] = useState("");
  const [addCollectedAt, setAddCollectedAt] = useState("");
  const [addExpiry, setAddExpiry] = useState("");

  const loadData = async () => {
    try {
      // 1. Fetch hospitals (profiles with type = 'hospital')
      const { data: hospitalData } = await supabase
        .from("donor_profiles")
        .select("id, full_name, display_id")
        .eq("type", "hospital")
        .order("full_name");

      let loadedHospitals: any[] = [];
      if (hospitalData) {
        setHospitals(hospitalData);
        loadedHospitals = hospitalData;
      }

      // Check query params or localStorage or default to first hospital
      let selectedHosp: any = null;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        let hospitalIdParam = params.get("hospitalId");
        if (!hospitalIdParam) {
          hospitalIdParam = localStorage.getItem("last_selected_hospital_id");
        }
        if (hospitalIdParam) {
          selectedHosp = loadedHospitals.find(
            (h) => h.display_id === hospitalIdParam || h.id === hospitalIdParam
          ) || null;
        }
        if (!selectedHosp && loadedHospitals.length > 0) {
          selectedHosp = loadedHospitals[0];
        }
        if (selectedHosp) {
          setActiveHospital(selectedHosp);
          localStorage.setItem("last_selected_hospital_id", selectedHosp.id);
        }
      }

      // 2. Fetch inventory batches logged specifically for the active hospital
      if (selectedHosp) {
        const { data: batchesData } = await supabase
          .from("inventory_batches")
          .select("*, donor:donor_profiles!inner(full_name, type, display_id)")
          .eq("donor_id", selectedHosp.id)
          .order("collected_at", { ascending: false });

        if (batchesData) {
          const mapped = batchesData.map((b) => ({
            batchId: b.batch_id,
            hospitalName: b.donor?.full_name || "Unknown Hospital",
            hospitalDisplayId: b.donor?.display_id || "N/A",
            volumeMl: Number(b.volume_ml),
            collected: new Date(b.collected_at)
              .toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
              .replace(",", ""),
            storage: b.storage_location || "N/A",
            rawCollectedAt: b.collected_at,
            hospitalId: b.donor_id,
          }));
          setBatches(mapped);

          // 3. Compute stats specifically for this hospital
          const totalVol = mapped.reduce((sum, b) => sum + b.volumeMl, 0);

          // Count today's collections
          const todayStr = new Date().toISOString().slice(0, 10);
          const todayCount = mapped.filter((b) => b.rawCollectedAt.startsWith(todayStr)).length;

          setStats({
            totalVolume: `${totalVol.toLocaleString()} ml`,
            batchesToday: `${todayCount} Today`,
            avgTemp: "-18.5 °C",
            activeLocations: "1 Location",
          });
        }
      } else {
        setBatches([]);
        setStats({
          totalVolume: "0 ml",
          batchesToday: "0 Today",
          avgTemp: "N/A",
          activeLocations: "0 Locations",
        });
      }
    } catch (err) {
      console.error("Error loading terminal collection data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = async () => {
    if (!activeHospital) return;

    // Auto-generate Batch ID in the format: MB-YEAR-SEQUENTIAL_NUMBER
    const currentYear = new Date().getFullYear();
    const prefix = `MB-${currentYear}-`;
    try {
      const { count } = await supabase
        .from("inventory_batches")
        .select("batch_id", { count: "exact", head: true })
        .like("batch_id", `${prefix}%`);

      const nextSeq = (count || 0) + 1;
      setAddBatchId(`${prefix}${String(nextSeq).padStart(4, "0")}`);
    } catch (err) {
      console.error("Error generating batch ID:", err);
      setAddBatchId(`${prefix}${Math.floor(1000 + Math.random() * 9000)}`);
    }

    // Default Collected At to local date/time string formatted as YYYY-MM-DDTHH:MM
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    setAddCollectedAt(localISOTime);

    // Default Expiry Date to 3 months from now (YYYY-MM-DD)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3);
    setAddExpiry(expiryDate.toISOString().slice(0, 10));

    // Reset other fields
    setAddHospitalId(activeHospital.id);
    setAddVolume("");
    setAddStorage("");

    setIsAddModalOpen(true);
  };

  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBatchId || !addHospitalId || !addVolume || !addCollectedAt || !addExpiry) {
      alert("Please fill out all required fields.");
      return;
    }

    try {
      const { error } = await supabase.from("inventory_batches").insert([
        {
          batch_id: addBatchId.trim(),
          donor_id: addHospitalId,
          volume_ml: Number(addVolume),
          collected_at: new Date(addCollectedAt).toISOString(),
          expiry_date: addExpiry,
          lab_status: "pending",
          lab_label: "Pending QC",
          storage_location: addStorage.trim() || null,
        },
      ]);

      if (error) throw error;

      alert(`Successfully logged batch: ${addBatchId}`);
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Error logging collection entry: " + err.message);
    }
  };

  // Filter batches based on search query
  const filteredBatches = batches.filter((b) => {
    const query = searchQuery.toLowerCase();
    return (
      b.hospitalName.toLowerCase().includes(query) ||
      b.batchId.toLowerCase().includes(query) ||
      b.storage.toLowerCase().includes(query)
    );
  });

  if (!activeHospital) {
    return (
      <AppShell activeSlug="onsite-collection-terminal">
        <div className="bg-background min-h-screen pb-12">
          <LogisticsSubNav activeTab="terminal" />
          <main className="mx-auto max-w-[800px] px-4 py-16 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Icon name="screenshot_monitor" className="text-3xl" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-on-surface">No Hospital Selected</h2>
              <p className="text-on-surface-variant text-sm font-medium">
                Each hospital has its own onsite collection terminal. Please open a terminal for a specific hospital from the Logistics Map.
              </p>
            </div>
            <a
              href="/collection-point-logistics"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-[0.98] mx-auto"
            >
              <Icon name="explore" />
              <span>Go to Logistics Map</span>
            </a>
          </main>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeSlug="onsite-collection-terminal">
      <div className="bg-background min-h-screen pb-12">
        <LogisticsSubNav activeTab="terminal" />

        <main className="mx-auto max-w-[1600px] px-4 py-8 md:px-8 space-y-8">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-on-surface flex items-center gap-3">
                {activeHospital.full_name}
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-xs font-bold text-on-surface">
                  Onsite Collection Terminal
                </span>
              </h2>
            </div>
          </div>

          {/* Stats Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              label="Total Volume Collected"
              value={stats.totalVolume}
              icon="water_drop"
              subtext="This Location"
              accent="primary"
            />
            <StatCard
              label="Collections Today"
              value={stats.batchesToday}
              icon="inventory_2"
              subtext="Pending Sync"
              accent="secondary"
            />
            <StatCard
              label="Average Storage Temp"
              value={stats.avgTemp}
              icon="thermostat"
              subtext="Safe Range"
              accent="neutral"
            />
          </div>

          {/* Control Bar & Table Container */}
          <div className="bg-white rounded-2xl border border-outline-variant/35 shadow-sm overflow-hidden">
            {/* Filter and Actions Row */}
            <div className="p-6 border-b border-outline-variant/20 flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-lowest">
              <div className="relative w-full md:max-w-md">
                <Icon
                  name="search"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg"
                />
                <input
                  type="text"
                  placeholder="Search by location, batch, or storage..."
                  className="w-full pl-12 pr-4 py-2.5 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={openAddModal}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-[0.98] cursor-pointer text-sm"
                >
                  <Icon name="add_circle" className="text-lg" />
                  <span>Log Collection</span>
                </button>
              </div>
            </div>

            {/* Collection Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low">
                  <tr className="border-b border-outline-variant/20">
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Batch ID
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Volume (mL)
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Storage Location
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Collected At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-semibold text-sm">
                  {filteredBatches.length > 0 ? (
                    filteredBatches.map((batch, index) => (
                      <tr
                        key={batch.batchId}
                        className={`hover:bg-primary/5 transition-colors ${index % 2 === 1 ? "bg-surface-container-low/10" : ""
                          }`}
                      >
                        <td className="px-6 py-5">
                          <span className="font-mono bg-surface-container px-2.5 py-1 rounded text-xs text-on-surface font-bold">
                            {batch.batchId}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-on-surface">
                          {batch.volumeMl.toLocaleString()} mL
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <Icon name="kitchen" className="text-sm text-outline" />
                            <span>{batch.storage}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-on-surface-variant font-medium">
                          {batch.collected}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-outline font-medium">
                        No collection records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Log Collection Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-on-background/45 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            />

            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
              <div className="bg-primary px-8 py-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Log New Collection</h2>
                  <p className="text-primary-fixed/80 text-xs mt-1 font-semibold">
                    Register a new milk batch in inventory from location
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

              <form onSubmit={handleSubmitCollection} className="p-8 space-y-5">
                <div className="space-y-4">

                  {/* Batch ID (Read-only) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Batch ID *
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container text-on-surface-variant font-semibold text-sm outline-none cursor-not-allowed"
                      type="text"
                      readOnly
                      required
                      value={addBatchId}
                    />
                  </div>

                  {/* Location / Hospital (Read-only) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Location / Hospital
                    </label>
                    <input
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg bg-surface-container text-on-surface-variant font-semibold text-sm outline-none cursor-not-allowed"
                      type="text"
                      readOnly
                      required
                      value={`${activeHospital.full_name} (${activeHospital.display_id})`}
                    />
                  </div>

                  {/* Volume and Storage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Volume (mL) *
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white text-on-surface"
                        type="number"
                        required
                        placeholder="e.g. 450"
                        value={addVolume}
                        onChange={(e) => setAddVolume(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Storage Location
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white text-on-surface"
                        type="text"
                        placeholder="e.g. Freezer A-12"
                        value={addStorage}
                        onChange={(e) => setAddStorage(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Collected At and Expiry */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Collected At *
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-xs bg-white text-on-surface"
                        type="datetime-local"
                        required
                        value={addCollectedAt}
                        onChange={(e) => setAddCollectedAt(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                        Expiry Date *
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold text-sm bg-white text-on-surface"
                        type="date"
                        required
                        value={addExpiry}
                        onChange={(e) => setAddExpiry(e.target.value)}
                      />
                    </div>
                  </div>

                </div>

                {/* Submit / Cancel Actions Only */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-[0.98] cursor-pointer text-sm"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 border border-outline text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer text-sm"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
