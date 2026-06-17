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
  contact: string;
  cycles: number;
  verification: string;
  avatarUrl: string;
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
    id: "DON-8821",
    name: "Elena Sorvino",
    status: "verified",
    statusLabel: "Active",
    lastDonation: "Oct 12, 2023",
    totalVolume: "42.5 L",
    screeningDue: false,
    contact: "+1 (555) 293-1022",
    cycles: 24,
    verification: "Verified",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8e1GmQgQoHs2cryXymjEKe9DUNjdUOI705hWgCOdPteBBPQwZoiuStVQI2KHVmCLxBMHoo5Nm77dtzO4kWyAzQVm44glK0Ib_4MfBACNlYCENdP8qLuhUyXirrMH2ggjxV0OySm2Qn1HV11IATg7yKeyDsq14HHZ7zXI-Ewo6tBcGvGjFkJkJowaeyeVcJzfmVAXgEc5zNqw83zL8IhIAOYlEa-HlJfx2ovL1b22jG6Ogfa-3XPAgNCyO1S2LQdL-J2oB_UnlZiM",
  },
  {
    id: "DON-7712",
    name: "Maya Patel",
    status: "verified",
    statusLabel: "Active",
    lastDonation: "Oct 09, 2023",
    totalVolume: "18.2 L",
    screeningDue: false,
    contact: "+1 (555) 102-8832",
    cycles: 9,
    verification: "Verified",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDM_CnJo0yCpCMQWEV7wqiDczc9dX6qXmuKQFycNzE4b_9ZR08dYBb3VOG71dqRRkOI__fDQo8GmTZlwDgZncpWv7LiMTDRvPII3FXkHPZ1hCcYbFPXJZyiPDH3HIYlpjSBv34EHgK92eLfg36zYYP_8l_JEJUGP982X-TZO4OLNVEydVpIW3z1NoNEj4guL8U0N6eJ8OKMWYnwSlAOJEH6qdzX1_NcDYaa92Q7EEZZa3WV0ZBOq430QkG9ZqhZXcpSRz9DzpzUgno",
  },
  {
    id: "DON-3109",
    name: "Chloe Henderson",
    status: "neutral",
    statusLabel: "Inactive",
    lastDonation: "Sep 28, 2023",
    totalVolume: "3.1 L",
    screeningDue: true,
    contact: "+1 (555) 921-0045",
    cycles: 2,
    verification: "Pending Re-cert",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8bk4fLcpGFAFndtYYDhMieb79vqsFEr5p35frcRUbIAPkxW2RkG7aSQI8uoKBAmG5dBdVf_d0PWNJKNFYhHaAO9D6BbxGkOyoBhenUZPYUerfsqL8BmAwPB8ihlh_kNdlw1lzoiNUKREB_d23Takp2FKL9z4xl-39LrBus2rBH0F_a1xbag3V536qmsI1HOEIeqa-SGCB1XCKLgZdiOvFbH9t-0Yi0jJG4BSMPpOj1K04VjDBOecnN3ZjvaiWHfcwRwrFr6kiuEE",
  },
  {
    id: "DON-2201",
    name: "Rebecca Bloom",
    status: "verified",
    statusLabel: "Active",
    lastDonation: "Oct 14, 2023",
    totalVolume: "65.8 L",
    screeningDue: false,
    contact: "+1 (555) 441-1234",
    cycles: 41,
    verification: "Verified",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOkmElQlZZJ_OBo_ZXgLwHRYcRhMGYE9-PL0vNrLCroVjZqBEhdi-vnE-FbJ06ibyqTBBDlCm4UVP2iOhGbVr-GPawnFFE4CIRmG6ZJhc6MXcb-qsbMILUxkNKtCvMAkE6uBJa83RGJnk74I3O6qUNHAvPkfRLKKbA7ruU3Q5-cF-xPjjapDE_Hc9buIKxOBxCr_HmlcuJdOJCuos1SPjxOq-xB4sNO6jdy48XXrdFJePf3MyI_nn6uJJPZZVtisIV055mN8utBDM",
  },
  {
    id: "DON-1194",
    name: "Jessica Sterling",
    status: "fail",
    statusLabel: "Flagged",
    lastDonation: "Oct 01, 2023",
    totalVolume: "12.4 L",
    screeningDue: true,
    contact: "+1 (555) 309-8871",
    cycles: 6,
    verification: "Expired Labs",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJHVWn7EaTj4ucNGNYwOu4ingb7JlaXkwVDQTSJDnwz-rUFF-d0q51QhnwluUNtJkkZoxq8q61XpDlIesSX3E_2wnxdlr1i-lGBRHJHKUegeKWSNup_cYUTAD7NHqqNxh1Aky0p2rSCjUuftiVk2A6yz6I5s55BYd8zSM3W5FTECr_TO8Dt-EDBXssm0Ida2R_uIU3-sYGUBslkek08WwBvczpgiTf_pIhQHBbkv-wa2Tj9zrXwz1Qvzs3wj2QJndwG4OhNt1ybdI",
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
