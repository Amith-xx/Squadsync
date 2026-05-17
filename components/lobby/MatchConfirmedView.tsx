"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLobbyStore } from "@/store/lobbyStore";
import type { LobbyPlayerState } from "@/store/lobbyStore";

// ─── Pitch placeholder ────────────────────────────────────────────────────────

function PitchPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-navy-surface to-navy-dark">
      <svg viewBox="0 0 120 80" className="h-16 w-24 text-navy-border" fill="currentColor" aria-hidden="true">
        <rect x="2" y="2" width="116" height="76" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <circle cx="60" cy="40" r="16" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="60" cy="40" r="2.5" fill="currentColor" opacity="0.5" />
        <line x1="60" y1="2" x2="60" y2="78" stroke="currentColor" strokeWidth="2" />
        <rect x="2" y="20" width="18" height="40" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="100" y="20" width="18" height="40" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

// ─── Turf image with error fallback ──────────────────────────────────────────

function TurfImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);

  useEffect(() => { setErrored(false); }, [src]);

  if (!src || errored) return <PitchPlaceholder />;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 800px"
      onError={() => setErrored(true)}
    />
  );
}

// ─── Player row ───────────────────────────────────────────────────────────────

function PlayerRow({ player, isCaptain, teamColor }: {
  player: LobbyPlayerState;
  isCaptain: boolean;
  teamColor: "blue" | "red";
}) {
  const initials = player.name
    .trim()
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
      isCaptain
        ? teamColor === "blue" ? "border-blue-400/40 bg-blue-400/5" : "border-red-400/40 bg-red-400/5"
        : "border-navy-border bg-navy-dark"
    }`}>
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-navy-border bg-navy-surface">
        {player.image ? (
          <Image src={player.image} alt={player.name} width={32} height={32} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-neon-green">
            {initials}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-white">{player.name}</p>
        <div className="flex items-center gap-1.5">
          {player.position && (
            <span className="text-[9px] font-bold uppercase text-muted-foreground">
              {player.position}
            </span>
          )}
          {isCaptain && (
            <span className="text-[9px] font-black text-yellow-400">★ Captain</span>
          )}
        </div>
      </div>
      <span className="text-xs font-bold tabular-nums text-muted-foreground">
        {player.karmaScore}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MatchConfirmedView() {
  const router = useRouter();
  const candidateTurfs = useLobbyStore((s) => s.candidateTurfs);
  const selectedTurfId = useLobbyStore((s) => s.selectedTurfId);
  const players = useLobbyStore((s) => s.players);
  const teamA = useLobbyStore((s) => s.teamA);
  const teamB = useLobbyStore((s) => s.teamB);
  const captainA = useLobbyStore((s) => s.captainA);
  const captainB = useLobbyStore((s) => s.captainB);
  const matchId = useLobbyStore((s) => s.matchId);

  const selectedTurf = candidateTurfs.find((t) => t.id === selectedTurfId) ?? null;
  const teamAPlayers = players.filter((p) => teamA.includes(p.userId));
  const teamBPlayers = players.filter((p) => teamB.includes(p.userId));

  const firstImage = selectedTurf?.images[0] ?? null;
  const hasImage = !!firstImage;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Match confirmed banner */}
      <div className="rounded-2xl border border-neon-green/40 bg-neon-green/5 px-5 py-4 text-center shadow-[0_0_30px_rgba(0,230,115,0.1)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-green">
          Match Confirmed
        </p>
        <p className="mt-1 text-2xl font-black text-white">
          You&rsquo;re playing today! ⚽
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Head to the turf and get warmed up
        </p>
        {matchId && (
          <button
            onClick={() => router.push(`/match/${matchId}`)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neon-green px-6 py-3 text-sm font-black text-navy-darkest transition-all hover:bg-neon-green/90 hover:shadow-[0_0_24px_rgba(0,230,115,0.4)]"
          >
            Go to Match
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Turf card */}
      {selectedTurf ? (
        <div className="overflow-hidden rounded-2xl border border-navy-border bg-navy-dark">
          {/* Turf image */}
          <div className={`relative w-full overflow-hidden ${hasImage ? "h-44" : "h-24"}`}>
            {hasImage ? (
              <>
                <TurfImage src={firstImage} alt={selectedTurf.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/80 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-neon-green px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-navy-darkest">
                    ✓ Selected Turf
                  </span>
                </div>
              </>
            ) : (
              <PitchPlaceholder />
            )}
          </div>

          <div className="p-5">
            {!hasImage && (
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neon-green">
                Selected Turf ✓
              </p>
            )}
            <h3 className="text-lg font-black text-white">{selectedTurf.name}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{selectedTurf.address}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-navy-border bg-navy-surface p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Price
                </p>
                <p className="mt-0.5 text-base font-black text-neon-green">
                  ₹{selectedTurf.pricePerHour.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground">/hr</span>
                </p>
              </div>
              <div className="rounded-xl border border-navy-border bg-navy-surface p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Contact
                </p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  {selectedTurf.contactNumber || "—"}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                Schedule
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                Coordinate with your captain for the booking time.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-navy-border bg-navy-dark p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Match proceeds without a set turf — coordinate with your captain.
          </p>
        </div>
      )}

      {/* Teams */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Team A */}
        <div className="space-y-2">
          <div className="rounded-xl border border-blue-400/30 bg-blue-400/5 px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team</p>
            <h4 className="text-base font-black text-blue-400">A</h4>
          </div>
          <div className="space-y-1.5">
            {teamAPlayers.map((p) => (
              <PlayerRow
                key={p.userId}
                player={p}
                isCaptain={p.userId === captainA}
                teamColor="blue"
              />
            ))}
          </div>
        </div>

        {/* Team B */}
        <div className="space-y-2">
          <div className="rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team</p>
            <h4 className="text-base font-black text-red-400">B</h4>
          </div>
          <div className="space-y-1.5">
            {teamBPlayers.map((p) => (
              <PlayerRow
                key={p.userId}
                player={p}
                isCaptain={p.userId === captainB}
                teamColor="red"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
