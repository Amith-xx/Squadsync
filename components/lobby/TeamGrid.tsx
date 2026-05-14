"use client";

// TODO (Day 3): Two-column grid showing Team A and Team B after Snake Draft
export interface TeamGridProps {
  teamA: string[];
  teamB: string[];
  captainA?: string;
  captainB?: string;
}

export function TeamGrid({ teamA, teamB, captainA, captainB }: TeamGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="font-semibold mb-2 text-sm">Team A</h3>
        <ul className="space-y-1">
          {teamA.map((id) => (
            <li key={id} className="text-sm text-muted-foreground flex items-center gap-1">
              {id === captainA && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">C</span>
              )}
              {id}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold mb-2 text-sm">Team B</h3>
        <ul className="space-y-1">
          {teamB.map((id) => (
            <li key={id} className="text-sm text-muted-foreground flex items-center gap-1">
              {id === captainB && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">C</span>
              )}
              {id}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
