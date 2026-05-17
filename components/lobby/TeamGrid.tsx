"use client";

import type { LobbyPlayerState } from "@/store/lobbyStore";
import type { Position } from "@/types";

export interface TeamGridProps {
  teamAPlayers: LobbyPlayerState[];
  teamBPlayers: LobbyPlayerState[];
  captainA: string | null;
  captainB: string | null;
}

const POSITION_COLORS: Record<Position, string> = {
  GK: "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
  DEF: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  MID: "bg-neon-green/15 text-neon-green border-neon-green/30",
  FWD: "bg-red-400/15 text-red-400 border-red-400/30",
};

function PlayerAvatar({ name, image }: { name: string; image: string }) {
  const initials = name
    .trim()
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-navy-border bg-navy-surface">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neon-green">
          {initials}
        </div>
      )}
    </div>
  );
}

function PlayerCard({
  player,
  isCaptain,
  teamColor,
  index,
}: {
  player: LobbyPlayerState;
  isCaptain: boolean;
  teamColor: "blue" | "red";
  index: number;
}) {
  // Use karma as the displayed overall rating — it's the effective matchmaking score.
  // Power score (pace/shooting/etc.) is not stored client-side; karma is the proxy.
  const displayRating = Math.round(player.karmaScore);

  const borderClass =
    isCaptain
      ? teamColor === "blue"
        ? "border-blue-400/50 bg-blue-400/5"
        : "border-red-400/50 bg-red-400/5"
      : "border-navy-border bg-navy-dark";

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 w-full animate-fade-in-up ${borderClass}`}
      style={{ animationDelay: `${index * 60}ms`, opacity: 0, animationFillMode: "forwards" }}
    >
      {/* Rating bubble */}
      <div
        className={`shrink-0 flex h-9 w-9 flex-col items-center justify-center rounded-lg font-black tabular-nums ${
          teamColor === "blue"
            ? "bg-blue-400/15 text-blue-300"
            : "bg-red-400/15 text-red-300"
        }`}
      >
        <span className="text-sm leading-none">{displayRating}</span>
      </div>

      <PlayerAvatar name={player.name} image={player.image} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-white">{player.name}</span>
          {isCaptain && (
            <span className="shrink-0 rounded border border-yellow-400/30 bg-yellow-400/10 px-1 py-0 text-[9px] font-black uppercase tracking-wider text-yellow-400">
              ★ Captain
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {player.position && (
            <span
              className={`rounded border px-1 py-0 text-[9px] font-bold uppercase ${
                POSITION_COLORS[player.position]
              }`}
            >
              {player.position}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {player.karmaScore} karma
          </span>
        </div>
      </div>
    </div>
  );
}

function TeamColumn({
  label,
  players,
  captainId,
  teamColor,
  avgRating,
}: {
  label: string;
  players: LobbyPlayerState[];
  captainId: string | null;
  teamColor: "blue" | "red";
  avgRating: number;
}) {
  const headerBg =
    teamColor === "blue"
      ? "border-blue-400/30 bg-blue-400/5"
      : "border-red-400/30 bg-red-400/5";
  const headerText = teamColor === "blue" ? "text-blue-400" : "text-red-400";
  const ratingBg = teamColor === "blue" ? "bg-blue-400/10 text-blue-300" : "bg-red-400/10 text-red-300";

  return (
    <div className="flex flex-col gap-2">
      {/* Team header */}
      <div className={`rounded-xl border px-4 py-3 ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Team
            </p>
            <h3 className={`text-lg font-black ${headerText}`}>{label}</h3>
          </div>
          <div className={`rounded-lg px-3 py-1.5 text-center ${ratingBg}`}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Avg
            </p>
            <p className="text-lg font-black tabular-nums">{Math.round(avgRating)}</p>
          </div>
        </div>
      </div>

      {/* Player cards */}
      <div className="space-y-1.5">
        {players.map((player, i) => (
          <PlayerCard
            key={player.userId}
            player={player}
            isCaptain={player.userId === captainId}
            teamColor={teamColor}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

export function TeamGrid({
  teamAPlayers,
  teamBPlayers,
  captainA,
  captainB,
}: TeamGridProps) {
  const avgA =
    teamAPlayers.length > 0
      ? teamAPlayers.reduce((sum, p) => sum + p.karmaScore, 0) / teamAPlayers.length
      : 0;
  const avgB =
    teamBPlayers.length > 0
      ? teamBPlayers.reduce((sum, p) => sum + p.karmaScore, 0) / teamBPlayers.length
      : 0;

  return (
    <div className="space-y-4">
      {/* Balance indicator */}
      <div className="rounded-xl border border-navy-border bg-navy-dark px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-400">{Math.round(avgA)}</span>
            <div className="flex-1 h-2 w-32 rounded-full bg-navy-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-red-400 transition-all"
                style={{ width: "100%" }}
              />
            </div>
            <span className="text-sm font-bold text-red-400">{Math.round(avgB)}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Balance
            </p>
            <p className="text-xs font-bold text-neon-green">
              Δ {Math.abs(avgA - avgB).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Two-column team display */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamColumn
          label="A"
          players={teamAPlayers}
          captainId={captainA}
          teamColor="blue"
          avgRating={avgA}
        />
        <TeamColumn
          label="B"
          players={teamBPlayers}
          captainId={captainB}
          teamColor="red"
          avgRating={avgB}
        />
      </div>
    </div>
  );
}
