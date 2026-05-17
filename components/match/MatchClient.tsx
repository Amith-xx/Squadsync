"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMatch } from "@/hooks/useMatch";
import { ScoreReportForm } from "@/components/match/ScoreReportForm";
import { PlayerRatingCard } from "@/components/match/PlayerRatingCard";
import type { MatchClient as MatchData, MatchPlayerClient } from "@/types";

const IS_DEV = process.env.NODE_ENV === "development";

interface Props {
  match: MatchData;
  players: MatchPlayerClient[];
  myUserId: string;
}

function ScoreBanner({
  status,
  finalScore,
  scoreReportA,
  scoreReportB,
}: {
  status: string;
  finalScore: { teamA: number; teamB: number } | null;
  scoreReportA: MatchData["scoreReportA"];
  scoreReportB: MatchData["scoreReportB"];
}) {
  if (status === "confirmed" && finalScore) {
    return (
      <div className="rounded-2xl border border-neon-green/40 bg-neon-green/5 px-5 py-5 text-center shadow-[0_0_30px_rgba(0,230,115,0.1)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-green">Final Score</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase text-blue-400">Team A</p>
            <p className="text-5xl font-black tabular-nums text-white">{finalScore.teamA}</p>
          </div>
          <span className="text-3xl font-black text-muted-foreground">–</span>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase text-red-400">Team B</p>
            <p className="text-5xl font-black tabular-nums text-white">{finalScore.teamB}</p>
          </div>
        </div>
        <p className="mt-3 text-xs font-bold text-neon-green">Match Confirmed ✓</p>
      </div>
    );
  }

  if (status === "disputed") {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/5 px-5 py-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Score Disputed</p>
        <p className="mt-1 text-sm font-semibold text-white">Captains reported different scores.</p>
        <p className="mt-1 text-xs text-muted-foreground">Please contact support to resolve.</p>
      </div>
    );
  }

  const aSubmitted = !!scoreReportA;
  const bSubmitted = !!scoreReportB;

  return (
    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Awaiting Score Reports</p>
      <div className="mt-3 flex gap-6">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${aSubmitted ? "bg-neon-green" : "bg-navy-border"}`} />
          <span className={`text-xs font-semibold ${aSubmitted ? "text-neon-green" : "text-muted-foreground"}`}>
            Captain A {aSubmitted ? "submitted" : "pending"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${bSubmitted ? "bg-neon-green" : "bg-navy-border"}`} />
          <span className={`text-xs font-semibold ${bSubmitted ? "text-neon-green" : "text-muted-foreground"}`}>
            Captain B {bSubmitted ? "submitted" : "pending"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MatchClient({ match: initialMatch, players, myUserId }: Props) {
  const router = useRouter();
  const [match, setMatch] = useState(initialMatch);
  const [scoreSubmitted, setScoreSubmitted] = useState(
    (match.captainA === myUserId && !!match.scoreReportA) ||
    (match.captainB === myUserId && !!match.scoreReportB)
  );
  const [devCompleting, setDevCompleting] = useState(false);
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(
    match.attendanceConfirmed.includes(myUserId)
  );
  const [confirmingAttendance, setConfirmingAttendance] = useState(false);

  const { status: liveStatus, finalScore: liveFinalScore, isConfirmed, isDisputed } = useMatch(match.id);
  const resolvedStatus = isConfirmed ? "confirmed" : isDisputed ? "disputed" : liveStatus ?? match.status;
  const resolvedFinalScore = match.finalScore ?? liveFinalScore;

  const isCaptainA = match.captainA === myUserId;
  const isCaptainB = match.captainB === myUserId;
  const isCaptain = isCaptainA || isCaptainB;
  const myCaptainTeam: "A" | "B" | null = isCaptainA ? "A" : isCaptainB ? "B" : null;


  async function handleAttend() {
    if (confirmingAttendance || attendanceConfirmed) return;
    setConfirmingAttendance(true);
    try {
      const res = await fetch(`/api/matches/${match.id}/attend`, { method: "POST" });
      const data = await res.json() as { success: boolean };
      if (data.success) setAttendanceConfirmed(true);
    } finally {
      setConfirmingAttendance(false);
    }
  }

  async function handleDevComplete() {
    if (devCompleting) return;
    setDevCompleting(true);
    try {
      const res = await fetch("/api/dev/complete-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id }),
      });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        setMatch((m) => ({
          ...m,
          status: "confirmed",
          finalScore: { teamA: 3, teamB: 1 },
        }));
      }
    } finally {
      setDevCompleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Match</p>
        <h1 className="mt-0.5 text-2xl font-black text-white">
          5v5 <span className="text-neon-green">Post-Match</span>
        </h1>
      </div>

      {/* Score banner */}
      <ScoreBanner
        status={resolvedStatus}
        finalScore={resolvedFinalScore}
        scoreReportA={match.scoreReportA}
        scoreReportB={match.scoreReportB}
      />

      {/* Attendance confirm */}
      {resolvedStatus !== "confirmed" && (
        <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 ${
          attendanceConfirmed ? "border-neon-green/30 bg-neon-green/5" : "border-navy-border bg-navy-dark"
        }`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Attendance</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {attendanceConfirmed ? "You confirmed attendance ✓" : "Confirm you played today"}
            </p>
          </div>
          {!attendanceConfirmed && (
            <button
              onClick={handleAttend}
              disabled={confirmingAttendance}
              className="shrink-0 rounded-xl bg-neon-green/15 border border-neon-green/30 px-4 py-2 text-xs font-bold text-neon-green transition-all hover:bg-neon-green/25 disabled:opacity-50"
            >
              {confirmingAttendance ? "Confirming…" : "I Played"}
            </button>
          )}
        </div>
      )}

      {/* Score report form — captain only, match still pending */}
      {isCaptain && myCaptainTeam && resolvedStatus === "pending_reports" && !scoreSubmitted && (
        <ScoreReportForm
          matchId={match.id}
          team={myCaptainTeam}
          onSubmitted={() => setScoreSubmitted(true)}
        />
      )}

      {isCaptain && scoreSubmitted && resolvedStatus === "pending_reports" && (
        <div className="rounded-xl border border-neon-green/20 bg-neon-green/5 px-4 py-3 text-center">
          <p className="text-xs font-bold text-neon-green">Score submitted — waiting for other captain</p>
        </div>
      )}

      {/* Teams + Ratings */}
      <div className="space-y-4">
        {/* Team A */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-400">Team A</p>
          <div className="space-y-1.5">
            {players
              .filter((p) => p.team === "A")
              .map((p) => (
                p.userId === myUserId ? (
                  <div key={p.userId} className="flex items-center gap-3 rounded-xl border border-blue-400/20 bg-navy-dark px-3 py-2.5">
                    <div className="h-8 w-8 shrink-0 rounded-full border border-navy-border bg-navy-surface flex items-center justify-center text-[9px] font-bold text-neon-green">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-white">{p.name} <span className="text-[9px] text-neon-green">(You)</span></p>
                      {p.position && <span className="text-[9px] font-bold uppercase text-muted-foreground">{p.position}</span>}
                    </div>
                    {match.captainA === p.userId && <span className="text-[9px] font-black text-yellow-400">★ Captain</span>}
                  </div>
                ) : (
                  <PlayerRatingCard
                    key={p.userId}
                    matchId={match.id}
                    playerId={p.userId}
                    playerName={p.name}
                    playerImage={p.image}
                    position={p.position}
                    team="A"
                    alreadyRated={match.myRatings.includes(p.userId)}
                  />
                )
              ))}
          </div>
        </div>

        {/* Team B */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-red-400">Team B</p>
          <div className="space-y-1.5">
            {players
              .filter((p) => p.team === "B")
              .map((p) => (
                p.userId === myUserId ? (
                  <div key={p.userId} className="flex items-center gap-3 rounded-xl border border-red-400/20 bg-navy-dark px-3 py-2.5">
                    <div className="h-8 w-8 shrink-0 rounded-full border border-navy-border bg-navy-surface flex items-center justify-center text-[9px] font-bold text-neon-green">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold text-white">{p.name} <span className="text-[9px] text-neon-green">(You)</span></p>
                      {p.position && <span className="text-[9px] font-bold uppercase text-muted-foreground">{p.position}</span>}
                    </div>
                    {match.captainB === p.userId && <span className="text-[9px] font-black text-yellow-400">★ Captain</span>}
                  </div>
                ) : (
                  <PlayerRatingCard
                    key={p.userId}
                    matchId={match.id}
                    playerId={p.userId}
                    playerName={p.name}
                    playerImage={p.image}
                    position={p.position}
                    team="B"
                    alreadyRated={match.myRatings.includes(p.userId)}
                  />
                )
              ))}
          </div>
        </div>
      </div>

      {/* Back to dashboard */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-neon-green"
        >
          ← Back to Dashboard
        </button>
        <p className="text-[10px] font-mono text-muted-foreground/40">Match {match.id.slice(-6)}</p>
      </div>

      {/* DEV panel */}
      {IS_DEV && resolvedStatus === "pending_reports" && (
        <div className="rounded-xl border border-dashed border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Dev Mode Only</p>
              <p className="mt-0.5 text-sm font-bold text-white">Auto-Complete Match</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Sets score to 3–1, confirms match, applies karma.
              </p>
            </div>
            <button
              onClick={handleDevComplete}
              disabled={devCompleting}
              className="shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
            >
              {devCompleting ? "Completing…" : "Complete Match"}
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
