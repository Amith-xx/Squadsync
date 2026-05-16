"use client";

import { useEffect, useState, useCallback } from "react";
import { useLobbyStore } from "@/store/lobbyStore";
import { useUserStore } from "@/store/userStore";
import { useLobby } from "@/hooks/useLobby";
import { usePresence } from "@/hooks/usePresence";
import { PlayerSlot } from "@/components/lobby/PlayerSlot";
import { TeamGrid } from "@/components/lobby/TeamGrid";
import { getRegionLabel } from "@/lib/regions";
import type { LobbyClient as LobbyData, Position } from "@/types";

const MAX_PLAYERS = 10;
const IS_DEV = process.env.NODE_ENV === "development";

interface Props {
  lobby: LobbyData;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    waiting: { label: "Waiting for Players", cls: "text-neon-green border-neon-green/30 bg-neon-green/10" },
    ready_check: { label: "Ready Check", cls: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
    voting: { label: "Teams Formed", cls: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
    confirmed: { label: "Confirmed", cls: "text-purple-400 border-purple-400/30 bg-purple-400/10" },
    expired: { label: "Expired", cls: "text-red-400 border-red-500/30 bg-red-500/10" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "text-muted-foreground border-navy-border bg-navy-surface" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${cls}`}>
      {status === "waiting" && (
        <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
      )}
      {status === "ready_check" && (
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
      )}
      {label}
    </span>
  );
}

function Countdown({ expiresAt }: { expiresAt: string | null }) {
  const [display, setDisplay] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setDisplay("00:00");
        setIsUrgent(true);
        return;
      }
      setIsUrgent(diff < 5 * 60 * 1000);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setDisplay(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!display) return null;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Expires In
      </p>
      <p className={`mt-0.5 text-xl font-black tabular-nums ${isUrgent ? "text-red-400" : "text-white"}`}>
        {display}
      </p>
    </div>
  );
}

function ReadyProgressBar({ readyCount, total }: { readyCount: number; total: number }) {
  const pct = total > 0 ? (readyCount / total) * 100 : 0;
  const allReady = readyCount === total && total === MAX_PLAYERS;

  return (
    <div className={`rounded-xl border p-4 transition-all ${allReady ? "border-neon-green/40 bg-neon-green/5" : "border-navy-border bg-navy-dark"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Ready Status
        </p>
        <span className={`text-sm font-black tabular-nums ${allReady ? "text-neon-green" : "text-white"}`}>
          {readyCount}<span className="text-muted-foreground font-normal">/{total}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-navy-surface overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${allReady ? "bg-neon-green" : "bg-yellow-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {allReady && (
        <p className="mt-2 text-center text-xs font-bold text-neon-green animate-pulse">
          All players ready — balancing teams…
        </p>
      )}
    </div>
  );
}

function BalancingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Spinning football */}
      <div className="relative mb-6">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon-green/20 border-t-neon-green" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="h-8 w-8" fill="currentColor" aria-hidden="true">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none" className="text-neon-green/30" />
            <circle cx="20" cy="20" r="5" className="text-neon-green" />
          </svg>
        </div>
      </div>
      <p className="text-xl font-black text-white text-glow">Balancing Teams</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Running snake draft algorithm…
      </p>
    </div>
  );
}

function TeamsFormedBanner() {
  return (
    <div className="rounded-xl border border-neon-green/30 bg-neon-green/5 px-4 py-3 text-center animate-fade-in-up">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neon-green">
        Teams Balanced
      </p>
      <p className="mt-0.5 text-lg font-black text-white">
        Snake Draft Complete
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LobbyClient({ lobby }: Props) {
  const [leaving, setLeaving] = useState(false);
  const [isReadying, setIsReadying] = useState(false);
  const [fillingBots, setFillingBots] = useState(false);

  const setLobbyFn = useLobbyStore((s) => s.setLobby);
  const setPlayers = useLobbyStore((s) => s.setPlayers);
  const setTeams = useLobbyStore((s) => s.setTeams);
  const setPlayerReady = useLobbyStore((s) => s.setPlayerReady);
  const resetLobby = useLobbyStore((s) => s.resetLobby);

  const players = useLobbyStore((s) => s.players);
  const status = useLobbyStore((s) => s.status);
  const teamA = useLobbyStore((s) => s.teamA);
  const teamB = useLobbyStore((s) => s.teamB);
  const captainA = useLobbyStore((s) => s.captainA);
  const captainB = useLobbyStore((s) => s.captainB);

  const userId = useUserStore((s) => s.id);

  // Hydrate store from server-fetched snapshot
  useEffect(() => {
    setLobbyFn(lobby.id, lobby.region, lobby.status);
    setPlayers(
      lobby.players.map((p) => ({
        userId: p.userId,
        name: p.name,
        image: p.image,
        karmaScore: p.karmaScore,
        position: (p.position as Position | null) ?? null,
        isReady: p.isReady,
        team: p.team,
      }))
    );
    // Restore team state for reconnecting clients
    if (lobby.teamA.length > 0 && lobby.captainA && lobby.captainB) {
      setTeams(lobby.teamA, lobby.teamB, lobby.captainA, lobby.captainB);
    }
  }, [
    lobby.id,
    lobby.region,
    lobby.status,
    lobby.players,
    lobby.teamA,
    lobby.teamB,
    lobby.captainA,
    lobby.captainB,
    setLobbyFn,
    setPlayers,
    setTeams,
  ]);

  // Subscribe to Pusher realtime events
  useLobby(lobby.id);
  const { members } = usePresence(lobby.id);

  const isOnline = (pid: string) => members.some((m) => m.id === pid);

  // ─── Derived state ────────────────────────────────────────────────────────

  const currentStatus = status ?? lobby.status;
  const currentUser = players.find((p) => p.userId === userId);
  const isInLobby = !!currentUser;
  const readyCount = players.filter((p) => p.isReady).length;
  const emptySlots = Math.max(0, MAX_PLAYERS - players.length);
  const teamsFormed = teamA.length === 5 && teamB.length === 5;
  const allReady = players.length === MAX_PLAYERS && readyCount === MAX_PLAYERS;
  const isBalancing = allReady && !teamsFormed && currentStatus !== "voting";
  const showReadyPhase =
    players.length === MAX_PLAYERS &&
    !teamsFormed &&
    !isBalancing &&
    (currentStatus === "waiting" || currentStatus === "ready_check");

  const teamAPlayers = players.filter((p) => p.team === "A");
  const teamBPlayers = players.filter((p) => p.team === "B");

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function handleLeave() {
    if (leaving) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/lobbies/${lobby.id}/leave`, { method: "POST" });
      if (!res.ok) {
        setLeaving(false);
        return;
      }
      resetLobby();
      window.location.href = "/dashboard";
    } catch {
      setLeaving(false);
    }
  }

  const handleReady = useCallback(async () => {
    if (!userId || isReadying) return;
    setIsReadying(true);

    // Optimistic update
    const prevState = currentUser?.isReady ?? false;
    setPlayerReady(userId, !prevState);

    try {
      const res = await fetch(`/api/lobbies/${lobby.id}/ready`, { method: "POST" });
      if (!res.ok) {
        // Revert on failure
        setPlayerReady(userId, prevState);
      }
    } catch {
      setPlayerReady(userId, prevState);
    } finally {
      setIsReadying(false);
    }
  }, [userId, isReadying, currentUser?.isReady, lobby.id, setPlayerReady]);

  async function handleFillBots() {
    if (fillingBots) return;
    setFillingBots(true);
    try {
      await fetch(`/api/lobbies/${lobby.id}/bots`, { method: "POST" });
    } finally {
      setFillingBots(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Lobby · {getRegionLabel(lobby.region)}
            </p>
            <h1 className="mt-1 text-2xl font-black text-white">
              5v5 <span className="text-neon-green">Match</span>
            </h1>
            <div className="mt-2">
              <StatusLabel status={currentStatus ?? "waiting"} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!teamsFormed && <Countdown expiresAt={lobby.expiresAt} />}

            <button
              onClick={handleLeave}
              disabled={leaving || teamsFormed}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {leaving ? "Leaving…" : "Leave"}
            </button>
          </div>
        </div>
      </div>

      {/* Teams formed view */}
      {teamsFormed ? (
        <div className="space-y-6 animate-fade-in-up">
          <TeamsFormedBanner />
          <TeamGrid
            teamAPlayers={teamAPlayers}
            teamBPlayers={teamBPlayers}
            captainA={captainA}
            captainB={captainB}
          />
          <p className="text-center text-[10px] font-mono text-muted-foreground/40">
            Lobby ID: {lobby.id}
          </p>
        </div>
      ) : isBalancing ? (
        /* Balancing animation */
        <BalancingAnimation />
      ) : (
        /* Pre-teams view: player list + ready system */
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-navy-border bg-navy-dark p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Players
              </p>
              <p className="mt-0.5 text-2xl font-black text-white tabular-nums">
                {players.length}
                <span className="text-sm text-muted-foreground">/10</span>
              </p>
            </div>
            <div className="rounded-xl border border-navy-border bg-navy-dark p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Online
              </p>
              <p className="mt-0.5 text-2xl font-black text-neon-green tabular-nums">
                {members.length}
              </p>
            </div>
            <div className="rounded-xl border border-navy-border bg-navy-dark p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {showReadyPhase ? "Ready" : "Slots Left"}
              </p>
              <p className={`mt-0.5 text-2xl font-black tabular-nums ${showReadyPhase ? "text-yellow-400" : "text-white"}`}>
                {showReadyPhase ? `${readyCount}/10` : emptySlots}
              </p>
            </div>
          </div>

          {/* Ready progress bar — shown when lobby is full */}
          {showReadyPhase && (
            <ReadyProgressBar readyCount={readyCount} total={players.length} />
          )}

          {/* Ready Up button — only shown to players IN the lobby when lobby is full */}
          {isInLobby && showReadyPhase && (
            <button
              onClick={handleReady}
              disabled={isReadying}
              className={`w-full rounded-xl py-4 text-base font-black uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                currentUser?.isReady
                  ? "border border-neon-green/40 bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
                  : "bg-neon-green text-navy-darkest hover:bg-neon-green/90 hover:shadow-[0_0_28px_rgba(0,230,115,0.5)] animate-pulse-glow"
              }`}
            >
              {isReadying
                ? "Updating…"
                : currentUser?.isReady
                  ? "✓ You're Ready — Click to Unready"
                  : "Ready Up"}
            </button>
          )}

          {/* Waiting for players tip */}
          {players.length < MAX_PLAYERS && (
            <div className="rounded-xl border border-dashed border-navy-border/60 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                Waiting for <span className="font-bold text-white">{emptySlots}</span> more{" "}
                {emptySlots === 1 ? "player" : "players"} to join
              </p>
              {IS_DEV && (
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  Use the DEV button below to fill with bots
                </p>
              )}
            </div>
          )}

          {/* Player slots */}
          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Players
            </p>
            <div className="space-y-2">
              {players.map((player) => (
                <PlayerSlot
                  key={player.userId}
                  userId={player.userId}
                  name={player.name}
                  image={player.image}
                  karmaScore={player.karmaScore}
                  position={player.position}
                  isReady={player.isReady}
                  team={player.team}
                  isOnline={isOnline(player.userId)}
                  isCurrentUser={player.userId === userId}
                />
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <PlayerSlot
                  key={`empty-${i}`}
                  isEmpty
                  slotNumber={players.length + i + 1}
                />
              ))}
            </div>
          </section>

          {/* DEV MODE: bot fill button */}
          {IS_DEV && !teamsFormed && (
            <div className="rounded-xl border border-dashed border-yellow-400/30 bg-yellow-400/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                    Dev Mode Only
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-white">
                    Fill Lobby with Bots
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Adds {emptySlots > 0 ? emptySlots : "0"} bots (auto-ready) and triggers balancing.
                  </p>
                </div>
                <button
                  onClick={handleFillBots}
                  disabled={fillingBots || emptySlots === 0}
                  className="shrink-0 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-bold text-yellow-400 transition-all hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {fillingBots ? "Filling…" : "Fill Bots"}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-[10px] font-mono text-muted-foreground/40">
            Lobby ID: {lobby.id}
          </p>
        </div>
      )}
    </main>
  );
}
