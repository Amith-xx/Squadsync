import { getKarmaStatus } from "@/lib/utils/karmaEngine";

export interface KarmaBadgeProps {
  karmaScore: number;
  showScore?: boolean;
  size?: "sm" | "md";
}

const TIER_CONFIG = {
  trusted: { label: "Trusted", bg: "bg-neon-green/15", border: "border-neon-green/40", text: "text-neon-green" },
  standard: { label: "Standard", bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  shadow: { label: "Shadow Ban", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  hard: { label: "Banned", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
} as const;

export function KarmaBadge({ karmaScore, showScore = true, size = "sm" }: KarmaBadgeProps) {
  const status = getKarmaStatus(karmaScore);
  const cfg = TIER_CONFIG[status];

  const sizeClass =
    size === "md"
      ? "px-3 py-1.5 text-sm gap-2"
      : "px-2.5 py-0.5 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${cfg.bg} ${cfg.border} ${cfg.text} ${sizeClass}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "currentColor" }}
      />
      {cfg.label}
      {showScore && (
        <span className="font-mono opacity-75">· {karmaScore}</span>
      )}
    </span>
  );
}
