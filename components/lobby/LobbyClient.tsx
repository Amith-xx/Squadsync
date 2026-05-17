"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLobbyStore } from "@/store/lobbyStore";
import { useUserStore } from "@/store/userStore";
import { useLobby } from "@/hooks/useLobby";
import { usePresence } from "@/hooks/usePresence";
import { PlayerSlot } from "@/components/lobby/PlayerSlot";
import { TeamGrid } from "@/components/lobby/TeamGrid";
import { TurfVotingPanel } from "@/components/lobby/TurfVotingPanel";
import { LobbyChat } from "@/components/lobby/LobbyChat";
import { MatchConfirmedView } from "@/components/lobby/MatchConfirmedView";
import { getRegionLabel } from "@/lib/regions";
import type { LobbyClient as LobbyData, Position } from "@/types";

const MAX_PLAYERS = 10;
const IS_DEV = process.env.NODE_ENV === "development";

interface Props {
  lobby: LobbyData;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StageIndicator({ status }: { status: string }) {
  const stages = [
    { key: "waiting",    label: "Waiting"   },
    { key: "ready_check",label: "Ready"     },
    { key: "voting",     label: "Voting"    },
    { key: "confirmed",  label: "Confirmed" },
  ];

  const isComplete = status === "active" || status === "completed";
  const activeIdx = isComplete
    ? stages.length
    : stages.findIndex(
        (s) => s.key === status || (status === "balancing" && s.key === "ready_check")
      );

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
      {stages.map((stage, i) => {
        const done   = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={stage.key} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
              active
                ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                : done
                ? "bg-navy-surface text-muted-foreground/60 border border-navy-border/30"
                : "text-muted-foreground/40"
            }`}>
              {done && <span>✓</span>}
              {active && <span className="h-1 w-1 rounded-full bg-neon-green animate-pulse" />}
              {stage.label}
            </div>
            {i < stages.length - 1 && (
              <span className="text-[10px] text-navy-border">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    waiting:    { label: "Waiting for Players", cls: "text-neon-green border-neon-green/30 bg-neon-green/10"   },
    ready_check:{ label: "Ready Check",         cls: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"  },
    voting:     { label: "Turf Voting",          cls: "text-blue-400 border-blue-400/30 bg-blue-400/10"        },
    confirmed:  { label: "Match Confirmed",      cls: "text-neon-green border-neon-green/30 bg-neon-green/10"  },
    active:     { label: "Match Active",         cls: "text-neon-green border-neon-green/30 bg-neon-green/10"  },
    completed:  { label: "Completed",            cls: "text-muted-foreground border-navy-border bg-navy-surface"},
    expired:    { label: "Expired",              cls: "text-red-400 border-red-500/30 bg-red-500/10"           },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "text-muted-foreground border-navy-border bg-navy-surface" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${cls}`}>
      {(status === "waiting" || status === "ready_check") && (
        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${status === "waiting" ? "bg-neon-green" : "bg-yellow-400"}`} />
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
      if (diff <= 0) { setDisplay("00:00"); setIsUrgent(true); return; }
      setIsUrgent(diff < 5 * 60 * 1000);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setDisplay(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!display) return null;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Expires In</p>
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
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ready Status</p>
        <span className={`text-sm font-black tabular-nums ${allReady ? "text-neon-green" : "text-white"}`}>
          {readyCount}<span className="text-muted-foreground font-normal">/{total}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-navy-surface overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${allReady ? "bg-neon-green" : "bg-yellow-400"}`} style={{ width: `${pct}%` }} />
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
      <p className="mt-1 text-sm text-muted-foreground">Running snake draft algorithm…</p>
    </div>
  );
}

function TurfsLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-navy-border bg-navy-dark py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-green/20 border-t-neon-green" />
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Loading Turfs…
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LobbyClient({ lobby }: Props) {
  const [leaving,         setLeaving]         = useState(false);
  const [isReadying,      setIsReadying]       = useState(false);
  const [fillingBots,     setFillingBots]     = useState(false);
  const [isFetchingTurfs, setIsFetchingTurfs] = useState(false);

  // Ref guards — don't need to be in effect deps
  const turfFetchedRef  = useRef(false); // prevent re-firing fetch on every render
  const hasLeftRef      = useRef(false); // prevent double-leave when clicking Leave button

  const setLobbyFn        = useLobbyStore((s) => s.setLobby);
  const setPlayers        = useLobbyStore((s) => s.setPlayers);
  const setTeams          = useLobbyStore((s) => s.setTeams);
  const setPlayerReady    = useLobbyStore((s) => s.setPlayerReady);
  const setCandidateTurfs = useLobbyStore((s) => s.setCandidateTurfs);
  const setVotingDeadline = useLobbyStore((s) => s.setVotingDeadline);
  const setInitialVotes   = useLobbyStore((s) => s.setInitialVotes);
  const setSelectedTurf   = useLobbyStore((s) => s.setSelectedTurf);
  const setMatchIdFn      = useLobbyStore((s) => s.setMatchId);
  const resetLobby        = useLobbyStore((s) => s.resetLobby);

  const players        = useLobbyStore((s) => s.players);
  const status         = useLobbyStore((s) => s.status);
  const teamA          = useLobbyStore((s) => s.teamA);
  const teamB          = useLobbyStore((s) => s.teamB);
  const captainA       = useLobbyStore((s) => s.captainA);
  const captainB       = useLobbyStore((s) => s.captainB);
  const candidateTurfs = useLobbyStore((s) => s.candidateTurfs);
  const votingDeadline = useLobbyStore((s) => s.votingDeadline);
  const matchId        = useLobbyStore((s) => s.matchId);

  const userId = useUserStore((s) => s.id);

  // ─── Hydrate store from server snapshot ────────────────────────────────
  useEffect(() => {
    setLobbyFn(lobby.id, lobby.region, lobby.status);
    setPlayers(
      lobby.players.map((p) => ({
        userId:     p.userId,
        name:       p.name,
        image:      p.image,
        karmaScore: p.karmaScore,
        position:   (p.position as Position | null) ?? null,
        isReady:    p.isReady,
        team:       p.team,
      }))
    );
    if (lobby.teamA.length > 0 && lobby.captainA && lobby.captainB) {
      setTeams(lobby.teamA, lobby.teamB, lobby.captainA, lobby.captainB);
    }
    setCandidateTurfs(lobby.candidateTurfs);
    setVotingDeadline(lobby.votingDeadline);
    if (lobby.turfVotes.length > 0 && userId) {
      setInitialVotes(lobby.turfVotes, userId);
    }
    if (lobby.selectedTurfId) {
      setSelectedTurf(lobby.selectedTurfId);
    }
    if (lobby.matchId) {
      setMatchIdFn(lobby.matchId);
    }
  }, [
    lobby.id, lobby.region, lobby.status, lobby.players,
    lobby.teamA, lobby.teamB, lobby.captainA, lobby.captainB,
    lobby.candidateTurfs, lobby.votingDeadline, lobby.turfVotes, lobby.selectedTurfId, lobby.matchId,
    userId,
    setLobbyFn, setPlayers, setTeams, setCandidateTurfs, setVotingDeadline,
    setInitialVotes, setSelectedTurf, setMatchIdFn,
  ]);

  // ─── Reactive refetch when voting starts but turfs not yet in store ────
  // Triggered when Pusher TEAMS_FORMED fires → setStatus("voting") while
  // candidateTurfs=[] (page was loaded before balancing ran).
  // turfFetchedRef prevents this from looping when candidateTurfs stays empty
  // (e.g. no turfs seeded for that region).
  useEffect(() => {
    if (status !== "voting" || candidateTurfs.length > 0 || turfFetchedRef.current) return;

    turfFetchedRef.current = true;
    setIsFetchingTurfs(true);

    fetch(`/api/lobbies/${lobby.id}`)
      .then((r) => r.json() as Promise<{ success: boolean; data: LobbyData }>)
      .then(({ success, data }) => {
        if (!success) return;
        setCandidateTurfs(data.candidateTurfs);
        setVotingDeadline(data.votingDeadline);
        if (data.turfVotes.length > 0 && userId) setInitialVotes(data.turfVotes, userId);
        if (data.selectedTurfId) setSelectedTurf(data.selectedTurfId);
      })
      .catch(() => { /* non-fatal */ })
      .finally(() => setIsFetchingTurfs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, candidateTurfs.length]); // intentionally narrow — ref + stable setters don't need listing

  // ─── Auto-leave when closing/refreshing the tab or navigating away ─────
  // sendBeacon is fire-and-forget; works even on unload. Guards:
  //  - isInLobby ref: only real players leave, not spectators
  //  - hasLeftRef: intentional Leave click already called the API, skip beacon
  const isInLobbyRef = useRef(false);
  useEffect(() => { isInLobbyRef.current = !!players.find((p) => p.userId === userId); }, [players, userId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isInLobbyRef.current && !hasLeftRef.current) {
        navigator.sendBeacon(`/api/lobbies/${lobby.id}/leave`);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [lobby.id]);

  useLobby(lobby.id);
  const { members } = usePresence(lobby.id);
  const isOnline = (pid: string) => members.some((m) => m.id === pid);

  // ─── Derived state ────────────────────────────────────────────────────────

  const currentStatus  = status ?? lobby.status;
  const currentUser    = players.find((p) => p.userId === userId);
  const isInLobby      = !!currentUser;
  const readyCount     = players.filter((p) => p.isReady).length;
  const emptySlots     = Math.max(0, MAX_PLAYERS - players.length);
  const teamsFormed    = teamA.length === 5 && teamB.length === 5;
  const allReady       = players.length === MAX_PLAYERS && readyCount === MAX_PLAYERS;
  const isBalancing    = allReady && !teamsFormed && currentStatus !== "voting" && currentStatus !== "confirmed" && currentStatus !== "active";
  const showReadyPhase =
    players.length === MAX_PLAYERS && !teamsFormed && !isBalancing &&
    (currentStatus === "waiting" || currentStatus === "ready_check");

  const isVoting    = currentStatus === "voting" && teamsFormed;
  const isConfirmed = currentStatus === "confirmed" || currentStatus === "active" || currentStatus === "completed";

  const teamAPlayers = players.filter((p) => teamA.includes(p.userId));
  const teamBPlayers = players.filter((p) => teamB.includes(p.userId));

  const showChat = teamsFormed && isInLobby;

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function handleLeave() {
    if (leaving) return;
    hasLeftRef.current = true; // suppress beacon — we're calling the API ourselves
    setLeaving(true);
    try {
      const res = await fetch(`/api/lobbies/${lobby.id}/leave`, { method: "POST" });
      if (!res.ok) { setLeaving(false); return; }
      resetLobby();
      window.location.href = "/dashboard";
    } catch {
      setLeaving(false);
    }
  }

  const handleReady = useCallback(async () => {
    if (!userId || isReadying) return;
    setIsReadying(true);
    const prevState = currentUser?.isReady ?? false;
    setPlayerReady(userId, !prevState);
    try {
      const res = await fetch(`/api/lobbies/${lobby.id}/ready`, { method: "POST" });
      if (!res.ok) setPlayerReady(userId, prevState);
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
      <div className="mb-6 animate-fade-in-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Lobby · {getRegionLabel(lobby.region)}
            </p>
            <h1 className="mt-1 text-2xl font-black text-white">
              5v5 <span className="text-neon-green">Match</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusLabel status={currentStatus ?? "waiting"} />
            </div>
            <div className="mt-2">
              <StageIndicator status={currentStatus ?? "waiting"} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!teamsFormed && <Countdown expiresAt={lobby.expiresAt} />}
            {!isConfirmed && (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {leaving ? "Leaving…" : "Leave"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Phase: Match Confirmed / Active / Completed ────────────────── */}
      {isConfirmed ? (
        <div className="space-y-6">
          <MatchConfirmedView />
          {matchId && (
            <div className="text-center">
              <a
                href={`/match/${matchId}`}
                className="inline-flex items-center gap-2 rounded-xl bg-neon-green px-8 py-3.5 text-base font-black text-navy-darkest transition-all hover:bg-neon-green/90 hover:shadow-[0_0_28px_rgba(0,230,115,0.45)]"
              >
                Go to Match Page
              </a>
            </div>
          )}
          {showChat && <LobbyChat lobbyId={lobby.id} />}
          <p className="text-center text-[10px] font-mono text-muted-foreground/40">
            Lobby ID: {lobby.id}
          </p>
        </div>

      ) : isBalancing ? (
        /* ── Phase: Balancing ─────────────────────────────────────────── */
        <BalancingAnimation />

      ) : teamsFormed ? (
        /* ── Phase: Teams formed → Voting → Turf selected ────────────── */
        <div className="space-y-6 animate-fade-in-up">
          {/* Teams always visible once formed */}
          <div className="rounded-2xl border border-navy-border bg-navy-dark p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neon-green">
              Teams Balanced ✓
            </p>
            <TeamGrid
              teamAPlayers={teamAPlayers}
              teamBPlayers={teamBPlayers}
              captainA={captainA}
              captainB={captainB}
            />
          </div>

          {/* Turf voting panel — with loading state while turfs fetch */}
          {isVoting && (
            isFetchingTurfs ? (
              <TurfsLoadingSpinner />
            ) : (
              <TurfVotingPanel
                lobbyId={lobby.id}
                candidateTurfs={candidateTurfs}
                votingDeadline={votingDeadline}
                isInLobby={isInLobby}
              />
            )
          )}

          {/* Chat */}
          {showChat && <LobbyChat lobbyId={lobby.id} />}

          <p className="text-center text-[10px] font-mono text-muted-foreground/40">
            Lobby ID: {lobby.id}
          </p>
        </div>

      ) : (
        /* ── Phase: Pre-teams (waiting / ready check) ─────────────────── */
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-navy-border bg-navy-dark p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Players</p>
              <p className="mt-0.5 text-2xl font-black text-white tabular-nums">
                {players.length}<span className="text-sm text-muted-foreground">/10</span>
              </p>
            </div>
            <div className="rounded-xl border border-navy-border bg-navy-dark p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Online</p>
              <p className="mt-0.5 text-2xl font-black text-neon-green tabular-nums">{members.length}</p>
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

          {showReadyPhase && (
            <ReadyProgressBar readyCount={readyCount} total={players.length} />
          )}

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

          <section>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Players</p>
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
                <PlayerSlot key={`empty-${i}`} isEmpty slotNumber={players.length + i + 1} />
              ))}
            </div>
          </section>

          {IS_DEV && !teamsFormed && (
            <div className="rounded-xl border border-dashed border-yellow-400/30 bg-yellow-400/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Dev Mode Only</p>
                  <p className="mt-0.5 text-sm font-bold text-white">Fill Lobby with Bots</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Adds {emptySlots > 0 ? emptySlots : "0"} bots (auto-ready, auto-vote, fake chat).
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
