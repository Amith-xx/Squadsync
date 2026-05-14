import { getKarmaStatus } from "@/lib/utils/karmaEngine";

// TODO (Day 5): Polished karma badge with color + status label
export interface KarmaBadgeProps {
  karmaScore: number;
  showScore?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  trusted: "bg-green-100 text-green-800 border-green-200",
  standard: "bg-yellow-100 text-yellow-800 border-yellow-200",
  shadow: "bg-orange-100 text-orange-800 border-orange-200",
  hard: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  trusted: "Trusted",
  standard: "Standard",
  shadow: "Shadow Banned",
  hard: "Banned",
};

export function KarmaBadge({ karmaScore, showScore = true }: KarmaBadgeProps) {
  const status = getKarmaStatus(karmaScore);
  const styles = STATUS_STYLES[status] ?? "";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
      {showScore && <span className="font-mono">·{karmaScore}</span>}
    </span>
  );
}
