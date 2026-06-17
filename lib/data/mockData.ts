import type { StatusVariant } from "@/components/milkbank/ui/StatusChip";

export type DonationRow = {
  id: string;
  dateTime: string;
  volumeMl: number;
  type: string;
  temp: string;
  status: StatusVariant;
  statusLabel: string;
};

export type InventoryBatch = {
  batchId: string;
  donor: string;
  volumeMl: number;
  collected: string;
  expiry: string;
  labStatus: StatusVariant;
  labLabel: string;
  storage: string;
};

export type DonorRow = {
  id: string;
  name: string;
  status: StatusVariant;
  statusLabel: string;
  lastDonation: string;
  totalVolume: string;
  screeningDue: boolean;
};

export type DispensingRecord = {
  id: string;
  beneficiary: string;
  ward: string;
  volumeMl: number;
  date: string;
  priority: "critical" | "standard";
  status: StatusVariant;
  statusLabel: string;
};

export type ExportJob = {
  id: string;
  dataset: string;
  format: string;
  rows: number;
  status: StatusVariant;
  statusLabel: string;
  requestedAt: string;
};

export type CollectionPoint = {
  id: string;
  name: string;
  address: string;
  activeDonors: number;
  volumeToday: string;
  status: StatusVariant;
  statusLabel: string;
};

export const inventoryStats = {
  totalVolume: "42,850 ml",
  batchesToday: "156 Today",
  passRate: "98.4%",
  freezerTemp: "-21.4 °C",
};

export const inventoryBatches: InventoryBatch[] = [
  {
    batchId: "MB-2024-0892",
    donor: "Sarah Jenkins",
    volumeMl: 450,
    collected: "Jun 17, 2026 08:30",
    expiry: "Aug 15, 2026",
    labStatus: "verified",
    labLabel: "Verified",
    storage: "Freezer A-12",
  },
  {
    batchId: "MB-2024-0891",
    donor: "Elena Rodriguez",
    volumeMl: 380,
    collected: "Jun 17, 2026 07:15",
    expiry: "Aug 14, 2026",
    labStatus: "pending",
    labLabel: "Pending QC",
    storage: "Freezer A-08",
  },
  {
    batchId: "MB-2024-0890",
    donor: "Maya Patel",
    volumeMl: 520,
    collected: "Jun 16, 2026 16:45",
    expiry: "Aug 13, 2026",
    labStatus: "verified",
    labLabel: "Verified",
    storage: "Freezer B-03",
  },
  {
    batchId: "MB-2024-0889",
    donor: "Lisa Chen",
    volumeMl: 290,
    collected: "Jun 16, 2026 14:20",
    expiry: "Aug 13, 2026",
    labStatus: "fail",
    labLabel: "Failed",
    storage: "Quarantine Q-01",
  },
];

export const donationLogStats = {
  totalVolume: "12,450",
  donations: "24",
  impact: "Nurturing 8 Infants",
};

export const donationRows: DonationRow[] = [
  {
    id: "1",
    dateTime: "Jun 17, 2026 · 09:15",
    volumeMl: 450,
    type: "Fresh",
    temp: "4.2°C",
    status: "verified",
    statusLabel: "Verified",
  },
  {
    id: "2",
    dateTime: "Jun 16, 2026 · 14:30",
    volumeMl: 380,
    type: "Frozen",
    temp: "-20°C",
    status: "pending",
    statusLabel: "Processing",
  },
  {
    id: "3",
    dateTime: "Jun 15, 2026 · 11:00",
    volumeMl: 520,
    type: "Fresh",
    temp: "3.8°C",
    status: "verified",
    statusLabel: "Verified",
  },
];

export const donorDirectoryStats = {
  activeDonors: "142",
  totalVolume: "1,240 L",
  newThisMonth: "08",
  dueScreening: "12",
};

export const donorRows: DonorRow[] = [
  {
    id: "D-1042",
    name: "Sarah Jenkins",
    status: "verified",
    statusLabel: "Active",
    lastDonation: "Jun 17, 2026",
    totalVolume: "42.5 L",
    screeningDue: false,
  },
  {
    id: "D-1038",
    name: "Elena Rodriguez",
    status: "pending",
    statusLabel: "Screening Due",
    lastDonation: "Jun 10, 2026",
    totalVolume: "28.0 L",
    screeningDue: true,
  },
  {
    id: "D-1021",
    name: "Maya Patel",
    status: "verified",
    statusLabel: "Active",
    lastDonation: "Jun 16, 2026",
    totalVolume: "56.2 L",
    screeningDue: false,
  },
];

export const dispensingRecords: DispensingRecord[] = [
  {
    id: "DISP-4421",
    beneficiary: "Baby A. Thorne",
    ward: "NICU-3A",
    volumeMl: 120,
    date: "Jun 17, 2026",
    priority: "critical",
    status: "verified",
    statusLabel: "Dispensed",
  },
  {
    id: "DISP-4420",
    beneficiary: "Baby M. Chen",
    ward: "NICU-2B",
    volumeMl: 85,
    date: "Jun 17, 2026",
    priority: "critical",
    status: "pending",
    statusLabel: "Scheduled",
  },
  {
    id: "DISP-4419",
    beneficiary: "Baby L. Santos",
    ward: "Pediatrics-4",
    volumeMl: 200,
    date: "Jun 16, 2026",
    priority: "standard",
    status: "verified",
    statusLabel: "Dispensed",
  },
];

export const exportJobs: ExportJob[] = [
  {
    id: "EXP-901",
    dataset: "Inventory & Lab Results",
    format: "CSV",
    rows: 1402,
    status: "verified",
    statusLabel: "Complete",
    requestedAt: "2 hours ago",
  },
  {
    id: "EXP-900",
    dataset: "Donor Registry",
    format: "XLSX",
    rows: 142,
    status: "pending",
    statusLabel: "Processing",
    requestedAt: "Jun 16, 2026",
  },
];

export const mapDonors = [
  { name: "Sarah Jenkins", area: "Mission District", status: "verified" as const },
  { name: "Elena Rodriguez", area: "SOMA", status: "pending" as const },
  { name: "New Registration", area: "Castro", status: "neutral" as const },
];

export const collectionPoints: CollectionPoint[] = [
  {
    id: "CP-01",
    name: "Mission District Unit B",
    address: "2840 Mission St, San Francisco",
    activeDonors: 8,
    volumeToday: "12.4 L",
    status: "verified",
    statusLabel: "Operational",
  },
  {
    id: "CP-02",
    name: "Bayview Collection Hub",
    address: "1450 Evans Ave, San Francisco",
    activeDonors: 5,
    volumeToday: "8.2 L",
    status: "pending",
    statusLabel: "Restocking",
  },
];

export const terminalSessions = [
  {
    id: "SES-881",
    donor: "Sarah Jenkins",
    volumeMl: 450,
    time: "09:15 AM",
    batchId: "MB-2024-0892",
  },
  {
    id: "SES-880",
    donor: "Anonymous #442",
    volumeMl: 320,
    time: "08:40 AM",
    batchId: "MB-2024-0891",
  },
];

export const staffProfile = {
  name: "Dr. Rivera",
  role: "Lab Technician",
  avatarInitials: "DR",
};

export const beneficiaryFormDefaults = {
  milkAvailable: "42.4L Pasteurised Milk Available",
  latency: "Optimal (14ms)",
};

export const donorRegistrationSteps = [
  "Personal Profile",
  "Health Intake",
  "Consent & Verification",
];

export const activityLogs = [
  {
    id: "1",
    message: "Screening completed for Maya Patel",
    time: "2 hours ago",
  },
  {
    id: "2",
    message: "New donation logged — 450ml from Sarah Jenkins",
    time: "4 hours ago",
  },
  {
    id: "3",
    message: "Batch MB-2024-0889 flagged for retest",
    time: "Yesterday",
  },
];
