"use client";

// TODO (Day 2): Render player avatar, name, ready state, team assignment
export interface PlayerSlotProps {
  userId?: string;
  name?: string;
  image?: string;
  isReady?: boolean;
  team?: "A" | "B" | null;
  isEmpty?: boolean;
}

export function PlayerSlot({ name, isReady, team, isEmpty = false }: PlayerSlotProps) {
  if (isEmpty) {
    return (
      <div className="rounded border border-dashed h-14 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Waiting...</span>
      </div>
    );
  }

  return (
    <div className="rounded border h-14 flex items-center gap-3 px-3">
      <div className="w-8 h-8 rounded-full bg-muted" />
      <span className="text-sm font-medium flex-1">{name}</span>
      {team && (
        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
          Team {team}
        </span>
      )}
      <span
        className={`text-xs px-1.5 py-0.5 rounded ${
          isReady ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
        }`}
      >
        {isReady ? "Ready" : "Not Ready"}
      </span>
    </div>
  );
}
