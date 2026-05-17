"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LobbyCard } from "@/components/lobby/LobbyCard";
import { getRegionLabel } from "@/lib/regions";
import type { LobbyListItem } from "@/types";

interface Props {
  region: string;
  initialLobbies: LobbyListItem[];
  userId: string;
  existingLobbyId: string | null;
}

const IS_DEV = process.env.NODE_ENV === "development";

export function DashboardLobbies({ region, initialLobbies, userId: _userId, existingLobbyId }: Props) {
  const router = useRouter();
  const [lobbies, setLobbies] = useState<LobbyListItem[]>(initialLobbies);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [findingGame, setFindingGame] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshLobbies = useCallback(async () => {
    try {
      const res = await fetch(`/api/lobbies?region=${region}`);
      const data = await res.json() as { success: boolean; data?: LobbyListItem[] };
      if (data.success && data.data) setLobbies(data.data);
    } catch {
      // Silently fail — user still sees stale list
    }
  }, [region]);

  async function handleDevReset() {
    if (resetting) return;
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await fetch("/api/dev/reset", { method: "POST" });
      const data = await res.json() as { success: boolean; data?: { lobbiesDeleted: number; botUsersDeleted: number; turfsSeeded: number } };
      if (data.success && data.data) {
        const { lobbiesDeleted, botUsersDeleted, turfsSeeded } = data.data;
        setResetMsg(`Cleared ${lobbiesDeleted} lobbies, ${botUsersDeleted} bots. ${turfsSeeded} turfs seeded.`);
        setLobbies([]);
      }
    } catch {
      setResetMsg("Reset failed — check console.");
    } finally {
      setResetting(false);
    }
  }

  async function handleJoin(lobbyId: string) {
    setJoiningId(lobbyId);
    setError(null);
    try {
      const res = await fetch(`/api/lobbies/${lobbyId}/join`, { method: "POST" });
      const data = await res.json() as { success: boolean; error?: string; code?: string };

      if (!res.ok) {
        if (data.code === "ALREADY_JOINED") {
          router.push(`/lobby/${lobbyId}`);
          return;
        }
        setError(data.error ?? "Could not join lobby");
        await refreshLobbies();
        return;
      }

      router.push(`/lobby/${lobbyId}`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setJoiningId(null);
    }
  }

  async function handleFindGame() {
    setFindingGame(true);
    setError(null);
    try {
      // Refresh lobby list first
      const listRes = await fetch(`/api/lobbies?region=${region}`);
      const listData = await listRes.json() as { success: boolean; data?: LobbyListItem[] };

      if (listData.success && listData.data) {
        setLobbies(listData.data);
        // Find an open lobby the user can join
        const openLobby = listData.data.find(
          (l) => l.playerCount < 10 && l.status === "waiting"
        );

        if (openLobby) {
          await handleJoin(openLobby.id);
          return;
        }
      }

      // No open lobby found — create a new one
      const createRes = await fetch("/api/lobbies", { method: "POST" });
      const createData = await createRes.json() as { success: boolean; data?: { id: string }; error?: string; code?: string };

      if (!createRes.ok) {
        if (createData.code === "ALREADY_IN_LOBBY" && existingLobbyId) {
          router.push(`/lobby/${existingLobbyId}`);
          return;
        }
        setError(createData.error ?? "Could not create lobby");
        return;
      }

      if (createData.data) {
        router.push(`/lobby/${createData.data.id}`);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setFindingGame(false);
    }
  }

  const filteredLobbies = lobbies.filter((l) => l.playerCount < 10 && l.status === "waiting");

  return (
    <div className="space-y-6">
      {/* Find a Game panel */}
      <div className="relative overflow-hidden rounded-2xl border border-neon-green/20 bg-neon-green/5 p-6">
        {/* Background football decoration */}
        <div className="pointer-events-none absolute right-4 top-4 opacity-5" aria-hidden="true">
          <svg viewBox="0 0 120 120" className="h-24 w-24 text-neon-green" fill="currentColor">
            <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="4" fill="none" />
            <polygon points="60,20 75,45 105,45 82,62 90,90 60,72 30,90 38,62 15,45 45,45" fill="currentColor" opacity="0.3" />
          </svg>
        </div>

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neon-green">
                {getRegionLabel(region)}
              </p>
              <h2 className="mt-1 text-xl font-black text-white">Find a Game</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredLobbies.length > 0
                  ? `${filteredLobbies.length} open ${filteredLobbies.length === 1 ? "lobby" : "lobbies"} in your area`
                  : "No open lobbies — you'll create one"}
              </p>
            </div>

            {existingLobbyId ? (
              <button
                onClick={() => router.push(`/lobby/${existingLobbyId}`)}
                className="shrink-0 rounded-xl border border-neon-green/40 bg-neon-green/10 px-5 py-3 text-sm font-bold text-neon-green transition-all hover:bg-neon-green/20"
              >
                Rejoin Lobby
              </button>
            ) : (
              <button
                onClick={handleFindGame}
                disabled={findingGame}
                className="shrink-0 rounded-xl bg-neon-green px-5 py-3 text-sm font-bold text-navy-darkest transition-all hover:bg-neon-green/90 hover:shadow-[0_0_24px_rgba(0,230,115,0.4)] disabled:cursor-not-allowed disabled:opacity-60 animate-pulse-glow"
              >
                {findingGame ? "Searching…" : "Find a Game"}
              </button>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Open lobbies list */}
      {filteredLobbies.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Open Lobbies · {getRegionLabel(region)}
            </p>
            <button
              onClick={refreshLobbies}
              className="text-[10px] font-semibold text-muted-foreground transition-colors hover:text-neon-green"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2">
            {filteredLobbies.map((lobby) => (
              <LobbyCard
                key={lobby.id}
                lobbyId={lobby.id}
                region={lobby.region}
                playerCount={lobby.playerCount}
                status={lobby.status}
                expiresAt={lobby.expiresAt}
                isJoining={joiningId === lobby.id}
                onJoin={handleJoin}
              />
            ))}
          </div>
        </div>
      )}

      {filteredLobbies.length === 0 && (
        <div className="rounded-xl border border-dashed border-navy-border py-10 text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            No open lobbies in {getRegionLabel(region)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Click &quot;Find a Game&quot; to create one and invite others.
          </p>
        </div>
      )}

      {IS_DEV && (
        <div className="rounded-xl border border-dashed border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Dev Mode Only</p>
              <p className="mt-0.5 text-sm font-bold text-white">Reset All Data</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Deletes all lobbies &amp; bot users, re-seeds turfs. Real accounts are kept.
              </p>
              {resetMsg && (
                <p className="mt-1.5 text-[10px] font-semibold text-neon-green">{resetMsg}</p>
              )}
            </div>
            <button
              onClick={handleDevReset}
              disabled={resetting}
              className="shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetting ? "Resetting…" : "Reset DB"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
