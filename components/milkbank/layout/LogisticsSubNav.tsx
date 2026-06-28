import Link from "next/link";
import { Icon } from "../ui/Icon";

export interface LogisticsSubNavProps {
  readonly activeTab: "map" | "terminal";
}

export function LogisticsSubNav({ activeTab }: LogisticsSubNavProps) {
  return (
    <div className="border-b border-outline-variant/30 bg-surface-container-lowest/50 backdrop-blur-sm">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <div className="flex gap-6">
          <Link
            href="/collection-point-logistics"
            className={`flex items-center gap-2 border-b-2 py-4 text-sm font-semibold transition-all ${
              activeTab === "map"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant/50"
            }`}
          >
            <Icon name="explore" className="text-base" />
            <span>Logistics Map</span>
          </Link>
          {activeTab === "terminal" && (
            <div className="flex items-center gap-2 border-b-2 py-4 text-sm font-bold border-primary text-primary">
              <Icon name="screenshot_monitor" className="text-base" />
              <span>Collection Terminal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
