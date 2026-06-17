export type NavItem = {
  label: string;
  href: string;
  slug: string;
};

export const APP_NAV_ITEMS: NavItem[] = [
  { label: "Inventory", href: "/inventory-lab-results", slug: "inventory-lab-results" },
  { label: "Data Export", href: "/data-export", slug: "data-export" },
  { label: "Beneficiary Data", href: "/beneficiary-dispensing", slug: "beneficiary-dispensing" },
  { label: "Donor Information", href: "/donor-directory", slug: "donor-directory" },
  { label: "Collection Logistics", href: "/collection-point-logistics", slug: "collection-point-logistics" },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Donation Log", href: "/milk-donation-log", slug: "milk-donation-log" },
  { label: "Donor Registration", href: "/donor-registration", slug: "donor-registration" },
  { label: "Beneficiary Registration", href: "/beneficiary-registration", slug: "beneficiary-registration" },
];

export const ALL_ROUTES = [
  { slug: "login", href: "/login", label: "Login" },
  ...APP_NAV_ITEMS,
  ...SECONDARY_NAV_ITEMS,
];
