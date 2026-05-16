"use client";

import type { Position, Team } from "@/types";

export interface PlayerSlotProps {
  userId?: string;
  name?: string;
  image?: string;
  karmaScore?: number;
  position?: Position | null;
  isReady?: boolean;
  team?: Team | null;
  isOnline?: boolean;
  isCurrentUser?: boolean;
  isEmpty?: boolean;
  slotNumber?: number;
}

function PlayerAvatar({
  name,
  image,
  isOnline,
}: {
  name: string;
  image?: string;
  isOnline?: boolean;
}) {
  const initials = name
    .trim()
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative shrink-0">
      <div className="h-10 w-10 overflow-hidden rounded-full border border-navy-border bg-navy-surface">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neon-green">
            {initials}
          </div>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy-dark ${
            isOnline ? "bg-neon-green" : "bg-muted"
          }`}
        />
      )}
    </div>
  );
}

const POSITION_COLORS: Record<Position, string> = {
  GK: "text-yellow-400",
  DEF: "text-blue-400",
  MID: "text-neon-green",
  FWD: "text-red-400",
};

function KarmaColor(score: number): string {
  if (score >= 80) return "text-neon-green";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

export function PlayerSlot({
  name,
  image,
  karmaScore,
  position,
  isReady = false,
  team,
  isOnline,
  isCurrentUser = false,
  isEmpty = false,
  slotNumber,
}: PlayerSlotProps) {
  if (isEmpty) {
    return (
      <div className="flex h-[64px] items-center gap-3 rounded-xl border border-dashed border-navy-border/60 px-4">
        <div className="h-10 w-10 shrink-0 rounded-full border border-dashed border-navy-border/60 bg-navy-surface/30" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground/60">
            {slotNumber ? `Slot ${slotNumber}` : "Waiting for player…"}
          </p>
        </div>
        <div className="flex h-5 items-center rounded border border-dashed border-navy-border/40 px-2">
          <span className="text-[10px] text-muted-foreground/40">—</span>
        </div>
      </div>
    );
  }

  if (!name) return null;

  return (
    <div
      className={`flex h-[64px] items-center gap-3 rounded-xl border px-4 transition-all duration-300 ${
        isReady
          ? isCurrentUser
            ? "border-neon-green/60 bg-neon-green/10 shadow-[0_0_14px_hsl(152_100%_45%/0.2)]"
            : "border-neon-green/30 bg-neon-green/5"
          : isCurrentUser
            ? "border-neon-green/30 bg-neon-green/5"
            : "border-navy-border bg-navy-dark"
      }`}
    >
      <PlayerAvatar name={name} image={image} isOnline={isOnline} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-white">
            {name}
          </span>
          {isCurrentUser && (
            <span className="shrink-0 rounded px-1 py-0 text-[9px] font-bold uppercase tracking-wider text-neon-green bg-neon-green/10 border border-neon-green/20">
              You
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          {position && (
            <span className={`text-[10px] font-bold ${POSITION_COLORS[position]}`}>
              {position}
            </span>
          )}
          {karmaScore !== undefined && (
            <span className={`text-[10px] font-semibold ${KarmaColor(karmaScore)}`}>
              {karmaScore} karma
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {team && (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              team === "A"
                ? "bg-blue-400/10 text-blue-400 border border-blue-400/30"
                : "bg-red-400/10 text-red-400 border border-red-400/30"
            }`}
          >
            {team}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isReady
              ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
              : "bg-navy-surface text-muted-foreground border border-navy-border"
          }`}
        >
          {isReady && (
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
          )}
          {isReady ? "Ready" : "Waiting"}
        </span>
      </div>
    </div>
  );
}
