"use client";

import { create } from "zustand";
import type {
  LobbyStatus,
  Position,
  PusherChatMessagePayload,
  PusherPlayerJoinedPayload,
} from "@/types";

// ─── Chat Message (client-side only, not persisted beyond 24h) ───────────────

interface ChatMessage {
  userId: string;
  name: string;
  image: string;
  message: string;
  sentAt: string;
}

// ─── Lobby Player Snapshot (populated via Pusher presence) ───────────────────

export interface LobbyPlayerState {
  userId: string;
  name: string;
  image: string;
  karmaScore: number;
  position: Position | null;
  isReady: boolean;
  team: "A" | "B" | null;
}

// ─── Turf Vote Tally ─────────────────────────────────────────────────────────

interface TurfVoteTally {
  turfId: string;
  count: number;
}

// ─── Lobby Store State ────────────────────────────────────────────────────────

interface LobbyState {
  lobbyId: string | null;
  status: LobbyStatus | null;
  region: string | null;
  players: LobbyPlayerState[];
  teamA: string[];
  teamB: string[];
  captainA: string | null;
  captainB: string | null;
  turfVotes: TurfVoteTally[];
  selectedTurfId: string | null;
  chatMessages: ChatMessage[];
}

interface LobbyActions {
  setLobby: (lobbyId: string, region: string, status: LobbyStatus) => void;
  setStatus: (status: LobbyStatus) => void;
  setPlayers: (players: LobbyPlayerState[]) => void;
  addPlayer: (player: PusherPlayerJoinedPayload) => void;
  removePlayer: (userId: string) => void;
  setPlayerReady: (userId: string, isReady: boolean) => void;
  setTeams: (teamA: string[], teamB: string[], captainA: string, captainB: string) => void;
  updateVotes: (turfId: string, voteCounts: Record<string, number>) => void;
  setSelectedTurf: (turfId: string) => void;
  addChatMessage: (message: PusherChatMessagePayload) => void;
  resetLobby: () => void;
}

const initialState: LobbyState = {
  lobbyId: null,
  status: null,
  region: null,
  players: [],
  teamA: [],
  teamB: [],
  captainA: null,
  captainB: null,
  turfVotes: [],
  selectedTurfId: null,
  chatMessages: [],
};

export const useLobbyStore = create<LobbyState & LobbyActions>((set) => ({
  ...initialState,

  setLobby: (lobbyId, region, status) =>
    set({ lobbyId, region, status }),

  setStatus: (status) => set({ status }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => ({
      players: state.players.some((p) => p.userId === player.userId)
        ? state.players
        : [
            ...state.players,
            {
              userId: player.userId,
              name: player.name,
              image: player.image,
              karmaScore: player.karmaScore,
              position: null,
              isReady: false,
              team: null,
            },
          ],
    })),

  removePlayer: (userId) =>
    set((state) => ({
      players: state.players.filter((p) => p.userId !== userId),
    })),

  setPlayerReady: (userId, isReady) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.userId === userId ? { ...p, isReady } : p
      ),
    })),

  setTeams: (teamA, teamB, captainA, captainB) =>
    set((state) => ({
      teamA,
      teamB,
      captainA,
      captainB,
      players: state.players.map((p) => ({
        ...p,
        team: teamA.includes(p.userId)
          ? "A"
          : teamB.includes(p.userId)
            ? "B"
            : null,
      })),
    })),

  updateVotes: (turfId, voteCounts) =>
    set({
      turfVotes: Object.entries(voteCounts).map(([id, count]) => ({
        turfId: id,
        count,
      })),
    }),

  setSelectedTurf: (turfId) => set({ selectedTurfId: turfId }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          userId: message.userId,
          name: message.name,
          image: message.image,
          message: message.message,
          sentAt: message.sentAt,
        },
      ],
    })),

  resetLobby: () => set(initialState),
}));
