"use client";

// TODO (Day 5): Captain-only form for submitting final score
export interface ScoreReportFormProps {
  matchId: string;
  team: "A" | "B";
  onSubmit?: (goalsA: number, goalsB: number) => void;
}

export function ScoreReportForm({ matchId, team }: ScoreReportFormProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Report Score — Team {team} Captain</h3>
      <p className="text-xs text-muted-foreground mb-2">Match: {matchId}</p>
      <div className="flex gap-4 items-center">
        <div>
          <label className="text-xs text-muted-foreground">Team A Goals</label>
          <input type="number" min={0} className="block border rounded px-2 py-1 w-16 mt-1" />
        </div>
        <span className="font-bold text-muted-foreground">vs</span>
        <div>
          <label className="text-xs text-muted-foreground">Team B Goals</label>
          <input type="number" min={0} className="block border rounded px-2 py-1 w-16 mt-1" />
        </div>
      </div>
      <button className="mt-4 text-sm px-4 py-2 rounded bg-primary text-primary-foreground w-full">
        Submit Score
      </button>
    </div>
  );
}
