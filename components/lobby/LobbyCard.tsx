"use client";

// TODO (Day 2): Display lobby region, player count, status badge, join button
export interface LobbyCardProps {
  lobbyId: string;
  region: string;
  playerCount: number;
  status: string;
  onJoin?: (lobbyId: string) => void;
}

export function LobbyCard({ lobbyId, region, playerCount, status }: LobbyCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="font-medium">{region}</p>
      <p className="text-sm text-muted-foreground">
        {playerCount}/10 · {status}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{lobbyId}</p>
    </div>
  );
}
