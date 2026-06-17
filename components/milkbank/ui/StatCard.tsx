import { Icon } from "./Icon";

export interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly subtext?: string;
  readonly icon: string;
  readonly accent?: "primary" | "secondary" | "tertiary" | "neutral";
}

const accentClasses = {
  primary: "bg-primary-container/10 text-primary border-primary-container/20",
  secondary: "bg-secondary-container/15 text-secondary border-secondary-container/25",
  tertiary: "bg-tertiary/10 text-tertiary border-tertiary/20",
  neutral: "bg-surface-container-low text-on-surface-variant border-outline-variant/40",
};

export function StatCard({
  label,
  value,
  subtext,
  icon,
  accent = "neutral",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg border ${accentClasses[accent]}`}
        >
          <Icon name={icon} className="text-lg" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-on-surface">{value}</p>
      {subtext ? (
        <p className="mt-1 text-sm text-on-surface-variant">{subtext}</p>
      ) : null}
    </div>
  );
}
