"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useLobbyStore } from "@/store/lobbyStore";
import type { TurfClient } from "@/types";

interface Props {
  lobbyId: string;
  candidateTurfs: TurfClient[];
  votingDeadline: string | null;
  isInLobby: boolean;
}

// ─── Football pitch SVG placeholder ─────────────────────────────────────────

function TurfPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-navy-surface to-navy-dark">
      <svg viewBox="0 0 80 60" className="h-12 w-16 text-navy-border" fill="currentColor" aria-hidden="true">
        {/* Pitch outline */}
        <rect x="2" y="2" width="76" height="56" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        {/* Centre circle */}
        <circle cx="40" cy="30" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
        {/* Centre spot */}
        <circle cx="40" cy="30" r="2" fill="currentColor" opacity="0.5" />
        {/* Centre line */}
        <line x1="40" y1="2" x2="40" y2="58" stroke="currentColor" strokeWidth="1.5" />
        {/* Left penalty box */}
        <rect x="2" y="15" width="14" height="30" stroke="currentColor" strokeWidth="1.5" fill="none" />
        {/* Right penalty box */}
        <rect x="64" y="15" width="14" height="30" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      <p className="text-[10px] font-semibold text-navy-border">No Image</p>
    </div>
  );
}

// ─── Turf image with error fallback ──────────────────────────────────────────

function TurfImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);

  // Reset error when src changes
  useEffect(() => { setErrored(false); }, [src]);

  if (!src || errored) return <TurfPlaceholder />;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      onError={() => setErrored(true)}
    />
  );
}

// ─── Voting countdown ─────────────────────────────────────────────────────────

function VotingCountdown({
  deadline,
  onExpire,
}: {
  deadline: string | null;
  onExpire: () => void;
}) {
  const [display, setDisplay] = useState<string | null>(null);
  const [urgent, setUrgent] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadline) return;

    let firedExpiry = false;

    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setDisplay("00:00");
        setUrgent(true);
        if (!firedExpiry) {
          firedExpiry = true;
          setExpired(true);
          onExpire();
        }
        return;
      }
      setUrgent(diff < 30 * 1000);
      const secs = Math.ceil(diff / 1000);
      const m = Math.floor(secs / 60).toString().padStart(2, "0");
      const s = (secs % 60).toString().padStart(2, "0");
      setDisplay(`${m}:${s}`);
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  if (!display) return null;

  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {expired ? "Time Up" : "Voting Closes In"}
      </p>
      <p
        className={`mt-0.5 text-2xl font-black tabular-nums ${
          urgent ? "text-red-400 animate-pulse" : "text-white"
        }`}
      >
        {display}
      </p>
    </div>
  );
}

// ─── Turf card ────────────────────────────────────────────────────────────────

function TurfCard({
  turf,
  voteCount,
  totalVotes,
  isMyVote,
  isWinner,
  onVote,
  disabled,
}: {
  turf: TurfClient;
  voteCount: number;
  totalVotes: number;
  isMyVote: boolean;
  isWinner: boolean;
  onVote: () => void;
  disabled: boolean;
}) {
  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  const firstImage = turf.images[0] ?? null;

  return (
    <button
      onClick={onVote}
      disabled={disabled}
      className={`
        group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green
        ${isMyVote
          ? "border-neon-green bg-neon-green/5 shadow-[0_0_20px_rgba(0,230,115,0.15)]"
          : isWinner
          ? "border-neon-green/60 bg-neon-green/5"
          : "border-navy-border bg-navy-dark hover:border-neon-green/40 hover:bg-navy-surface"
        }
        ${disabled ? "cursor-default" : "cursor-pointer"}
      `}
    >
      {/* Turf image */}
      <div className="relative h-36 w-full overflow-hidden bg-navy-surface">
        <TurfImage src={firstImage} alt={turf.name} />

        {/* Winner crown */}
        {isWinner && (
          <div className="absolute right-2 top-2 rounded-full bg-neon-green px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-navy-darkest">
            Leading
          </div>
        )}

        {/* My vote badge */}
        {isMyVote && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-navy-darkest/80 px-2 py-0.5 text-[10px] font-bold text-neon-green backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green" />
            Your vote
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-black text-white">{turf.name}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{turf.address}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-bold text-neon-green">
            ₹{turf.pricePerHour.toLocaleString()}/hr
          </span>
          <span className="text-xs text-muted-foreground">
            {voteCount} {voteCount === 1 ? "vote" : "votes"}
          </span>
        </div>

        {/* Vote bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy-surface">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isMyVote ? "bg-neon-green" : "bg-white/30"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Contact */}
        {turf.contactNumber && (
          <p className="mt-2 text-[10px] text-muted-foreground/60">
            📞 {turf.contactNumber}
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function TurfVotingPanel({ lobbyId, candidateTurfs, votingDeadline, isInLobby }: Props) {
  const [voting, setVoting] = useState(false);

  const turfVotes = useLobbyStore((s) => s.turfVotes);
  const myVote = useLobbyStore((s) => s.myVote);
  const selectedTurfId = useLobbyStore((s) => s.selectedTurfId);
  const setMyVote = useLobbyStore((s) => s.setMyVote);

  const totalVotes = turfVotes.reduce((sum, tv) => sum + tv.count, 0);
  const leadingId = turfVotes.length > 0
    ? turfVotes.reduce((a, b) => (a.count >= b.count ? a : b)).turfId
    : null;

  const handleVote = useCallback(async (turfId: string) => {
    if (!isInLobby || voting || selectedTurfId || myVote === turfId) return;
    const prevVote = myVote;
    setVoting(true);
    setMyVote(turfId); // Optimistic
    try {
      const res = await fetch(`/api/lobbies/${lobbyId}/vote/turf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turfId }),
      });
      if (!res.ok) setMyVote(prevVote); // Revert on failure
    } catch {
      setMyVote(prevVote);
    } finally {
      setVoting(false);
    }
  }, [isInLobby, voting, selectedTurfId, myVote, lobbyId, setMyVote]);

  const handleTimerExpire = useCallback(async () => {
    try {
      await fetch(`/api/lobbies/${lobbyId}/vote/resolve`, { method: "POST" });
    } catch { /* Non-fatal */ }
  }, [lobbyId]);

  if (candidateTurfs.length === 0) {
    return (
      <div className="rounded-2xl border border-navy-border bg-navy-dark p-6 text-center">
        <div className="mb-3 flex justify-center">
          <svg viewBox="0 0 48 48" className="h-10 w-10 text-navy-border" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="24" cy="24" r="20" />
            <path d="M24 4 L28 16 L40 16 L30 24 L34 36 L24 28 L14 36 L18 24 L8 16 L20 16 Z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">No turfs in your region</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Contact your region admin to add turfs. Match will proceed without a set turf.
        </p>
      </div>
    );
  }

  const colsClass =
    candidateTurfs.length === 1
      ? "grid-cols-1"
      : candidateTurfs.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Step 2
          </p>
          <h2 className="text-lg font-black text-white">
            {selectedTurfId ? "Turf Selected ✓" : "Vote for Your Turf"}
          </h2>
          {!selectedTurfId && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isInLobby ? "Tap a turf to cast your vote" : "Watching voting in progress"}
            </p>
          )}
        </div>
        {!selectedTurfId && (
          <VotingCountdown deadline={votingDeadline} onExpire={handleTimerExpire} />
        )}
        {selectedTurfId && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-green/30 bg-neon-green/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-neon-green">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-green" />
            Confirmed
          </span>
        )}
      </div>

      {/* Turf cards grid */}
      <div className={`grid gap-3 ${colsClass}`}>
        {candidateTurfs.map((turf) => {
          const tv = turfVotes.find((v) => v.turfId === turf.id);
          const isSelected = selectedTurfId === turf.id;
          return (
            <TurfCard
              key={turf.id}
              turf={turf}
              voteCount={tv?.count ?? 0}
              totalVotes={totalVotes}
              isMyVote={myVote === turf.id}
              isWinner={!selectedTurfId ? leadingId === turf.id : isSelected}
              onVote={() => void handleVote(turf.id)}
              disabled={!isInLobby || voting || !!selectedTurfId}
            />
          );
        })}
      </div>

      {/* Vote tally footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-navy-border bg-navy-surface px-4 py-2.5 text-xs">
        <span className="text-muted-foreground">
          <span className="font-bold text-white">{totalVotes}</span> / 10 votes cast
        </span>
        {!selectedTurfId && myVote && (
          <span className="font-semibold text-neon-green">Vote recorded ✓</span>
        )}
        {!selectedTurfId && !myVote && isInLobby && (
          <span className="text-yellow-400">Cast your vote above</span>
        )}
        {selectedTurfId && (
          <span className="font-semibold text-neon-green">Turf locked in ✓</span>
        )}
      </div>
    </div>
  );
}
