"use client";

// TODO (Day 5): Anonymous thumbs up / thumbs down rating card
export interface PlayerRatingCardProps {
  playerId: string;
  playerName: string;
  playerImage?: string;
  onRate?: (playerId: string, thumbsUp: boolean) => void;
}

export function PlayerRatingCard({
  playerId,
  playerName,
}: PlayerRatingCardProps) {
  return (
    <div className="flex items-center gap-3 border rounded-lg p-3">
      <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
      <span className="flex-1 text-sm font-medium">{playerName}</span>
      <button
        aria-label={`Thumbs up ${playerName}`}
        className="p-1.5 rounded hover:bg-green-50 text-green-600"
        data-player-id={playerId}
      >
        👍
      </button>
      <button
        aria-label={`Thumbs down ${playerName}`}
        className="p-1.5 rounded hover:bg-red-50 text-red-600"
        data-player-id={playerId}
      >
        👎
      </button>
    </div>
  );
}
