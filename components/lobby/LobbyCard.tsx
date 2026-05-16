"use client";

import { useState, useEffect } from "react";
import { getRegionLabel } from "@/lib/regions";
import type { LobbyStatus } from "@/types";

export interface LobbyCardProps {
  lobbyId: string;
  region: string;
  playerCount: number;
  status: LobbyStatus;
  expiresAt: string | null;
  isJoining?: boolean;
  onJoin: (lobbyId: string) => void;
}

function StatusBadge({ status }: { status: LobbyStatus }) {
  const styles: Record<LobbyStatus, string> = {
    waiting: "bg-neon-green/10 text-neon-green border-neon-green/30",
    ready_check: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
    voting: "bg-blue-400/10 text-blue-400 border-blue-400/30",
    confirmed: "bg-purple-400/10 text-purple-400 border-purple-400/30",
    active: "bg-orange-400/10 text-orange-400 border-orange-400/30",
    completed: "bg-muted text-muted-foreground border-navy-border",
    expired: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  const labels: Record<LobbyStatus, string> = {
    waiting: "Open",
    ready_check: "Ready Check",
    voting: "Voting",
    confirmed: "Confirmed",
    active: "In Progress",
    completed: "Completed",
    expired: "Expired",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
      {status === "waiting" && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
      )}
      {labels[status]}
    </span>
  );
}

function CountdownDisplay({ expiresAt }: { expiresAt: string | null }) {
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setDisplay("Expired");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setDisplay(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!display) return null;

  return (
    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
      {display}
    </span>
  );
}

function PlayerSlotDots({ count, max = 10 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i < count ? "bg-neon-green" : "bg-navy-surface border border-navy-border"
          }`}
        />
      ))}
    </div>
  );
}

export function LobbyCard({
  lobbyId,
  region,
  playerCount,
  status,
  expiresAt,
  isJoining = false,
  onJoin,
}: LobbyCardProps) {
  const isFull = playerCount >= 10;
  const canJoin = status === "waiting" && !isFull;

  return (
    <div className="group rounded-xl border border-navy-border bg-navy-dark p-4 transition-all hover:border-navy-border/80 hover:bg-navy-surface">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate">
              {getRegionLabel(region)}
            </span>
            <StatusBadge status={status} />
          </div>

          <div className="mt-2">
            <PlayerSlotDots count={playerCount} />
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-white">{playerCount}</span>
              <span>/10 players</span>
            </span>
            <CountdownDisplay expiresAt={expiresAt} />
          </div>
        </div>

        {canJoin && (
          <button
            onClick={() => onJoin(lobbyId)}
            disabled={isJoining}
            className="shrink-0 rounded-lg bg-neon-green px-3 py-2 text-xs font-bold text-navy-darkest transition-all hover:bg-neon-green/90 hover:shadow-[0_0_14px_rgba(0,230,115,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isJoining ? "Joining…" : "Join"}
          </button>
        )}

        {isFull && (
          <span className="shrink-0 rounded-lg border border-navy-border px-3 py-2 text-xs font-bold text-muted-foreground">
            Full
          </span>
        )}
      </div>
    </div>
  );
}
