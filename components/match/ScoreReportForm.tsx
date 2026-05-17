"use client";

import { useState } from "react";

export interface ScoreReportFormProps {
  matchId: string;
  team: "A" | "B";
  onSubmitted: () => void;
}

export function ScoreReportForm({ matchId, team, onSubmitted }: ScoreReportFormProps) {
  const [goalsA, setGoalsA] = useState(0);
  const [goalsB, setGoalsB] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || done) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/matches/${matchId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalsA, goalsB }),
      });
      const data = await res.json() as { success: boolean; error?: string; data?: { status: string } };

      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to submit score");
        return;
      }

      setDone(true);
      onSubmitted();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-neon-green/30 bg-neon-green/5 px-5 py-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neon-green">Score Submitted</p>
        <p className="mt-1 text-sm font-semibold text-white">
          {goalsA} – {goalsB}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Waiting for other captain…</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-navy-border bg-navy-dark p-5 space-y-4"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Captain Team {team} · Report Score
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Enter the final score as you observed it.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Team A goals */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Team A</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGoalsA((v) => Math.max(0, v - 1))}
              className="h-8 w-8 rounded-lg border border-navy-border bg-navy-surface text-lg font-bold text-white transition-colors hover:border-blue-400/40 hover:text-blue-400"
            >−</button>
            <span className="w-10 text-center text-2xl font-black tabular-nums text-white">{goalsA}</span>
            <button
              type="button"
              onClick={() => setGoalsA((v) => v + 1)}
              className="h-8 w-8 rounded-lg border border-navy-border bg-navy-surface text-lg font-bold text-white transition-colors hover:border-blue-400/40 hover:text-blue-400"
            >+</button>
          </div>
        </div>

        <span className="text-2xl font-black text-muted-foreground">–</span>

        {/* Team B goals */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Team B</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGoalsB((v) => Math.max(0, v - 1))}
              className="h-8 w-8 rounded-lg border border-navy-border bg-navy-surface text-lg font-bold text-white transition-colors hover:border-red-400/40 hover:text-red-400"
            >−</button>
            <span className="w-10 text-center text-2xl font-black tabular-nums text-white">{goalsB}</span>
            <button
              type="button"
              onClick={() => setGoalsB((v) => v + 1)}
              className="h-8 w-8 rounded-lg border border-navy-border bg-navy-surface text-lg font-bold text-white transition-colors hover:border-red-400/40 hover:text-red-400"
            >+</button>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-neon-green py-3 text-sm font-black uppercase tracking-wider text-navy-darkest transition-all hover:bg-neon-green/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit Score"}
      </button>
    </form>
  );
}
