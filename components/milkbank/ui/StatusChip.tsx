export type StatusVariant = "verified" | "pending" | "fail" | "neutral";

export interface StatusChipProps {
  readonly label: string;
  readonly variant: StatusVariant;
}

const variantClasses: Record<StatusVariant, string> = {
  verified: "bg-secondary-container/20 text-secondary border-secondary/30",
  pending: "bg-primary-container/20 text-primary border-primary-container/40",
  fail: "bg-fail/15 text-fail border-fail/30",
  neutral: "bg-surface-container text-on-surface-variant border-outline-variant",
};

export function StatusChip({ label, variant }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}
