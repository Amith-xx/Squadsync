"use client";

import Image from "next/image";
import { useState } from "react";

export interface PlayerRatingCardProps {
  matchId: string;
  playerId: string;
  playerName: string;
  playerImage?: string;
  position?: string | null;
  team: "A" | "B";
  alreadyRated?: boolean;
}

export function PlayerRatingCard({
  matchId,
  playerId,
  playerName,
  playerImage,
  position,
  team,
  alreadyRated = false,
}: PlayerRatingCardProps) {
  const [rated, setRated] = useState(alreadyRated);
  const [submitting, setSubmitting] = useState(false);
  const [choice, setChoice] = useState<boolean | null>(null);

  const initials = playerName
    .trim()
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleRate(thumbsUp: boolean) {
    if (rated || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratedId: playerId, thumbsUp }),
      });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        setRated(true);
        setChoice(thumbsUp);
      }
    } catch {
      // Silently fail — not critical
    } finally {
      setSubmitting(false);
    }
  }

  const teamColor = team === "A" ? "border-blue-400/20" : "border-red-400/20";

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
      rated ? "bg-navy-surface opacity-75" : `bg-navy-dark ${teamColor}`
    }`}>
      {/* Avatar */}
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-navy-border bg-navy-surface">
        {playerImage ? (
          <Image src={playerImage} alt={playerName} width={32} height={32} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-neon-green">
            {initials}
          </div>
        )}
      </div>

      {/* Name + position */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-white">{playerName}</p>
        {position && (
          <span className="text-[9px] font-bold uppercase text-muted-foreground">{position}</span>
        )}
      </div>

      {/* Rating buttons */}
      {rated ? (
        <span className={`text-sm font-bold ${choice === true ? "text-neon-green" : "text-red-400"}`}>
          {choice === true ? "👍 Rated" : "👎 Rated"}
        </span>
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleRate(true)}
            disabled={submitting}
            aria-label={`Thumbs up ${playerName}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neon-green/20 bg-neon-green/5 text-sm transition-all hover:border-neon-green/50 hover:bg-neon-green/15 disabled:opacity-50"
          >
            👍
          </button>
          <button
            onClick={() => handleRate(false)}
            disabled={submitting}
            aria-label={`Thumbs down ${playerName}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-sm transition-all hover:border-red-500/50 hover:bg-red-500/15 disabled:opacity-50"
          >
            👎
          </button>
        </div>
      )}
    </div>
  );
}
