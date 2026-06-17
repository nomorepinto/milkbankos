import Link from "next/link";
import { Icon } from "../ui/Icon";

export interface DonorSubNavProps {
  readonly activeTab: "registry" | "locations";
}

export function DonorSubNav({ activeTab }: DonorSubNavProps) {
  return (
    <div className="border-b border-outline-variant/30 bg-surface-container-lowest/50 backdrop-blur-sm">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="flex gap-6">
          <Link
            href="/donor-directory"
            className={`flex items-center gap-2 border-b-2 py-4 text-sm font-semibold transition-all ${
              activeTab === "registry"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/50"
            }`}
          >
            <Icon name="volunteer_activism" className="text-base" />
            <span>Donor Registry</span>
          </Link>
          <Link
            href="/donor-community-map"
            className={`flex items-center gap-2 border-b-2 py-4 text-sm font-semibold transition-all ${
              activeTab === "locations"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/50"
            }`}
          >
            <Icon name="map" className="text-base" />
            <span>Donor Locations</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
