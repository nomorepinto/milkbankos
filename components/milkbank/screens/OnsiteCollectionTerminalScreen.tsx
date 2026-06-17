"use client";

import { useState } from "react";
import { AppShell } from "@/components/milkbank/layout/AppShell";
import { LogisticsSubNav } from "@/components/milkbank/layout/LogisticsSubNav";
import { Icon } from "@/components/milkbank/ui/Icon";

export interface OnsiteCollectionTerminalScreenProps {}

type SessionLog = {
  id: string;
  time: string;
  donorName: string;
  donorId: string;
  volumeMl: number;
  status: "verified" | "fail";
  statusLabel: string;
};

const INITIAL_LOGS: SessionLog[] = [
  {
    id: "LOG-01",
    time: "10:45 AM",
    donorName: "Jessica Thompson",
    donorId: "DON-8821",
    volumeMl: 240,
    status: "verified",
    statusLabel: "Verified",
  },
  {
    id: "LOG-02",
    time: "09:12 AM",
    donorName: "Amanda Lee",
    donorId: "DON-7712",
    volumeMl: 180,
    status: "fail",
    statusLabel: "Flagged",
  },
];

type Batch = {
  id: string;
  entries: number;
  volumeL: number;
  status: "OPEN" | "SHIPPED";
  timeLabel?: string;
};

const INITIAL_BATCHES: Batch[] = [
  {
    id: "B-202310-04",
    entries: 6,
    volumeL: 1.4,
    status: "OPEN",
  },
  {
    id: "B-202310-03",
    entries: 12,
    volumeL: 3.2,
    status: "SHIPPED",
    timeLabel: "Handed over to logistics at 08:30 AM",
  },
];

export function OnsiteCollectionTerminalScreen(_props: Readonly<OnsiteCollectionTerminalScreenProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDonor, setCurrentDonor] = useState({ name: "Sarah J. Miller", id: "9928" });
  const [volume, setVolume] = useState("");
  const [temperature, setTemperature] = useState("");
  const [expressionTime, setExpressionTime] = useState("");
  const [milkType, setMilkType] = useState("Standard Mature Milk");
  const [observations, setObservations] = useState("");
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>(INITIAL_LOGS);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);

  // Walk-In Donor Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInDob, setWalkInDob] = useState("");
  const [walkInInfantAge, setWalkInInfantAge] = useState("");

  // Search donor mapping simulation
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const lower = val.toLowerCase();
    if (lower.includes("jessica") || lower.includes("thompson")) {
      setCurrentDonor({ name: "Jessica Thompson", id: "8821" });
    } else if (lower.includes("amanda") || lower.includes("lee")) {
      setCurrentDonor({ name: "Amanda Lee", id: "7712" });
    } else if (lower.includes("chloe") || lower.includes("henderson")) {
      setCurrentDonor({ name: "Chloe Henderson", id: "3109" });
    } else if (lower.includes("rebecca") || lower.includes("bloom")) {
      setCurrentDonor({ name: "Rebecca Bloom", id: "2201" });
    } else if (lower) {
      setCurrentDonor({ name: val, id: "TEMP-" + Math.floor(1000 + Math.random() * 9000) });
    } else {
      setCurrentDonor({ name: "Sarah J. Miller", id: "9928" });
    }
  };

  // Submit new donation entry
  const handleLogDonation = () => {
    if (!volume || isNaN(Number(volume))) {
      alert("Please enter a valid donation volume.");
      return;
    }
    
    const volNum = Number(volume);
    
    // Add new log
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    const newLog: SessionLog = {
      id: "LOG-" + (sessionLogs.length + 1).toString().padStart(2, "0"),
      time: timeStr,
      donorName: currentDonor.name,
      donorId: "DON-" + currentDonor.id,
      volumeMl: volNum,
      status: "verified",
      statusLabel: "Verified",
    };

    setSessionLogs([newLog, ...sessionLogs]);
    
    // Update active batch (B-202310-04) stats
    setBatches(batches.map(b => {
      if (b.id === "B-202310-04") {
        return {
          ...b,
          entries: b.entries + 1,
          volumeL: Number((b.volumeL + volNum / 1000).toFixed(2)),
        };
      }
      return b;
    }));

    // Reset fields
    setVolume("");
    setTemperature("");
    setExpressionTime("");
    setObservations("");
    alert("Donation entry logged successfully!");
  };

  // Submit walk-in donor registration
  const handleSubmitWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName) {
      alert("Please enter donor full name.");
      return;
    }
    const generatedId = Math.floor(1000 + Math.random() * 9000).toString();
    setCurrentDonor({ name: walkInName, id: generatedId });
    setIsModalOpen(false);
    
    // Reset modal fields
    setWalkInName("");
    setWalkInPhone("");
    setWalkInDob("");
    setWalkInInfantAge("");
    alert(`Donor ${walkInName} registered and selected for current session.`);
  };

  // Initiate new batch
  const handleInitiateBatch = () => {
    const nextNum = batches.length + 1;
    const batchId = `B-202310-${nextNum.toString().padStart(2, "0")}`;
    const newBatch: Batch = {
      id: batchId,
      entries: 0,
      volumeL: 0,
      status: "OPEN",
    };
    setBatches([newBatch, ...batches]);
    alert(`Initiated new batch: ${batchId}`);
  };

  // Compute total intake volume in liters
  const totalVolumeL = (sessionLogs.reduce((acc, log) => acc + log.volumeMl, 0) / 1000).toFixed(1);

  return (
    <AppShell activeSlug="onsite-collection-terminal">
      <div className="bg-background min-h-screen pb-12">
        <LogisticsSubNav activeTab="terminal" />

        <main className="mx-auto max-w-[1600px] px-4 py-8 md:px-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Active Collection Site
                </span>
              </div>
              <h2 className="text-3xl font-bold text-on-background flex items-center gap-3">
                St. Jude Medical Plaza
                <span className="bg-surface-container-high px-3 py-1 rounded-full text-xs font-bold text-on-surface">
                  ROOM 402
                </span>
              </h2>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-on-surface-variant mb-1">Sync Status</span>
              <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 rounded-lg border border-secondary/20">
                <Icon name="cloud_done" className="text-sm" />
                <span className="text-xs font-bold">Synchronized</span>
              </div>
            </div>
          </div>

          {/* Bento Grid Content */}
          <div className="grid grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Donor & Intake */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              
              {/* Search & Quick Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <Icon name="person_search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
                  <input
                    className="w-full pl-12 pr-4 py-4 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm font-semibold text-on-surface shadow-sm"
                    placeholder="Search Donor by Name, ID, or Phone..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-3 bg-primary-dark text-white font-bold py-4 px-6 rounded-xl hover:bg-black transition-colors shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  <Icon name="person_add" />
                  <span>Register Walk-In Donor</span>
                </button>
              </div>

              {/* Donation Form Card */}
              <div className="bg-white rounded-xl border border-outline-variant/35 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon name="water_drop" filled className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-on-surface">Intake Session Details</h3>
                      <p className="text-xs font-semibold text-on-surface-variant uppercase">
                        Current Donor: <span className="font-bold text-on-surface">{currentDonor.name} (ID: {currentDonor.id})</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-semibold text-on-surface-variant block">Batch Assignment</span>
                    <span className="text-xs font-bold bg-primary/15 px-2 py-1 rounded text-primary uppercase">
                      {batches.find(b => b.status === "OPEN")?.id || "None Open"}
                    </span>
                  </div>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Donation Volume (mL)
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold"
                        placeholder="0.00"
                        type="number"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xs font-bold">ML</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Storage Temperature (°C)
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none font-semibold"
                        placeholder="-18.0"
                        step="0.1"
                        type="number"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xs font-bold">°C</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Date &amp; Time of Expressing
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold"
                      type="datetime-local"
                      value={expressionTime}
                      onChange={(e) => setExpressionTime(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Milk Type / Status
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold"
                      value={milkType}
                      onChange={(e) => setMilkType(e.target.value)}
                    >
                      <option>Standard Mature Milk</option>
                      <option>Colostrum</option>
                      <option>Transitional Milk</option>
                      <option>Preterm Donor Milk</option>
                    </select>
                  </div>
                  
                  <div className="col-span-full space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Clinical Observations &amp; Notes
                    </label>
                    <textarea
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold"
                      placeholder="Enter any significant notes about appearance, aroma, or collection process..."
                      rows={3}
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                    />
                  </div>
                  
                  <div className="col-span-full pt-4 flex gap-4">
                    <button
                      onClick={handleLogDonation}
                      type="button"
                      className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Icon name="save" />
                      <span>Log Donation Entry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVolume("");
                        setTemperature("");
                        setExpressionTime("");
                        setObservations("");
                      }}
                      className="px-6 py-4 border border-outline text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>

              {/* Recent Entries Log */}
              <div className="bg-white rounded-xl border border-outline-variant/35 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-outline-variant/25 bg-surface-container-low flex justify-between items-center">
                  <h3 className="text-base font-bold text-on-surface">Today&apos;s Local Session Log</h3>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Total: {totalVolumeL} Liters
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Time</th>
                        <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Donor</th>
                        <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Volume</th>
                        <th className="px-6 py-3 text-xs font-bold text-on-surface-variant uppercase">Status</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-medium text-sm">
                      {sessionLogs.map((log, index) => (
                        <tr
                          key={log.id}
                          className={`hover:bg-primary/5 transition-colors ${
                            index % 2 === 1 ? "bg-surface-container-low/20" : ""
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold text-on-surface-variant">{log.time}</td>
                          <td className="px-6 py-4 font-bold text-on-surface">
                            <div>
                              <span>{log.donorName}</span>
                              <span className="text-outline text-xs block font-semibold">{log.donorId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-on-surface">{log.volumeMl} mL</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              log.status === "verified"
                                ? "bg-secondary-container/20 text-secondary"
                                : "bg-tertiary-container/20 text-tertiary"
                            }`}>
                              {log.statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              className="p-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                              onClick={() => alert(`Action triggered for ${log.id}`)}
                            >
                              <Icon name={log.status === "verified" ? "print" : "edit"} className="text-xl" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column: Batch & Tracking */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              
              {/* Real-time Metrics Card */}
              <div className="bg-primary-dark rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xs font-bold text-primary-fixed/60 uppercase mb-4 tracking-wider">
                    Current Session Metrics
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-bold">12/20</span>
                        <span className="text-xs text-primary-fixed/60 font-semibold">Bottles Remaining</span>
                      </div>
                      <div className="w-full bg-primary-fixed/20 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-container h-full w-[60%] rounded-full shadow-[0_0_10px_rgba(171,138,255,0.5)]"></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 font-bold">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <span className="text-[10px] text-primary-fixed/60 block uppercase">Avg. Temp</span>
                        <span className="text-xl font-bold">-18.4°C</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <span className="text-[10px] text-primary-fixed/60 block uppercase">Staff Onsite</span>
                        <span className="text-xl font-bold">03</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                  <Icon name="analytics" className="text-[160px]" />
                </div>
              </div>

              {/* Batch Status Panel */}
              <div className="bg-white rounded-xl border border-outline-variant/35 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-on-surface">Batch Tracking</h3>
                  <Icon name="history" className="text-outline" />
                </div>
                
                <div className="space-y-4">
                  {batches.map((batch) => {
                    const isOpen = batch.status === "OPEN";
                    return (
                      <div
                        key={batch.id}
                        className={`p-4 rounded-lg border flex items-start gap-4 ${
                          isOpen
                            ? "bg-surface-container-low border-outline-variant/40"
                            : "border-outline-variant/20 opacity-70"
                        }`}
                      >
                        <div className={`w-1.5 h-12 rounded-full ${isOpen ? "bg-secondary" : "bg-outline"}`} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-on-surface">{batch.id}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isOpen ? "bg-secondary-container/20 text-secondary" : "bg-surface-container text-on-surface-variant"
                            }`}>
                              {batch.status}
                            </span>
                          </div>
                          
                          <p className="text-xs text-on-surface-variant mt-1 font-semibold">
                            {batch.entries} Entries • {batch.volumeL}L Total
                          </p>
                          
                          {isOpen ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="text-[10px] font-bold text-primary uppercase hover:underline cursor-pointer"
                              >
                                View manifest
                              </button>
                              <button
                                type="button"
                                className="text-[10px] font-bold text-on-surface-variant uppercase hover:underline cursor-pointer"
                              >
                                Print tags
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] text-outline mt-2 italic font-semibold">{batch.timeLabel}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleInitiateBatch}
                  type="button"
                  className="w-full mt-6 py-3 border-2 border-dashed border-outline-variant text-on-surface-variant rounded-xl font-bold text-sm hover:bg-surface-container transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Icon name="add_box" />
                  <span>Initiate New Batch</span>
                </button>
              </div>

              {/* Ambient Background Compliance Card */}
              <div className="relative h-48 rounded-xl overflow-hidden group shadow-sm border border-outline-variant/35">
                <img
                  alt="Clinical Lab Environment"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 select-none pointer-events-none"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5aAzgFcX4WfA4TT2wE5S3cAdwkNscc5-fOVPuF734v7BdMMwbNrQdWf_y_b21hNM9aDZpuy_uXZgaRpbZWY4ObR1n8BQXYImU-tmI0mQ7bxTV2AmGfRro3K6xZVVeAsd2i_KpFvwtiPZYHmXBY2LQ4Kh_W89tWEY3DkHTT80VymTITZIypIM-hyY3-n8jqjivYROtL96bSGLZTSb6OyWdzU3IlSTE_YIBNFQTSx6o30I193EbN8P41xUTdZ_IxPw7kuOE_zcLRVU"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/90 to-transparent flex flex-col justify-end p-4">
                  <h4 className="text-white font-bold text-sm">Site Compliance Check</h4>
                  <p className="text-primary-fixed/80 text-[10px] font-semibold">
                    Last inspection: Today, 07:15 AM by supervisor
                  </p>
                </div>
              </div>

            </div>

          </div>
        </main>
        
        {/* Walk-In Donor Registration Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-on-background/45 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
              <div className="bg-primary px-8 py-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Register Walk-In Donor</h2>
                  <p className="text-primary-fixed/80 text-xs mt-1 font-semibold">
                    New donor initial screening and enrollment
                  </p>
                </div>
                <button
                  type="button"
                  className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white"
                  onClick={() => setIsModalOpen(false)}
                >
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={handleSubmitWalkIn} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Full Legal Name
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold"
                      type="text"
                      required
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Primary Phone
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold"
                      type="tel"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Date of Birth
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold"
                      type="date"
                      value={walkInDob}
                      onChange={(e) => setWalkInDob(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Infant Age (Months)
                    </label>
                    <input
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-semibold"
                      type="number"
                      value={walkInInfantAge}
                      onChange={(e) => setWalkInInfantAge(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                  <Icon name="info" className="text-secondary" />
                  <p className="text-xs text-on-surface-variant font-semibold">
                    By registering, you confirm that the preliminary health screening questionnaire has been completed and verified by onsite staff.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    Submit Registration
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-4 border border-outline text-on-surface-variant font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                    onClick={() => setIsModalOpen(false)}
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
