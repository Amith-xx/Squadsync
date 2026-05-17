"use client";

import { create } from "zustand";
import type {
  LobbyStatus,
  Position,
  TurfClient,
  PusherChatMessagePayload,
  PusherPlayerJoinedPayload,
} from "@/types";

// ─── Chat Message ────────────────────────────────────────────────────────────

interface ChatMessage {
  messageId: string;
  userId: string;
  name: string;
  image: string;
  message: string;
  sentAt: string;
}

// ─── Lobby Player Snapshot ────────────────────────────────────────────────────

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

// ─── Store ────────────────────────────────────────────────────────────────────

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
  candidateTurfs: TurfClient[];
  votingDeadline: string | null;
  matchId: string | null;
  myVote: string | null;
  chatMessages: ChatMessage[];
}

interface LobbyActions {
  setLobby: (lobbyId: string, region: string, status: LobbyStatus) => void;
  setStatus: (status: LobbyStatus) => void;
  setMatchId: (matchId: string | null) => void;
  setPlayers: (players: LobbyPlayerState[]) => void;
  addPlayer: (player: PusherPlayerJoinedPayload) => void;
  removePlayer: (userId: string) => void;
  setPlayerReady: (userId: string, isReady: boolean) => void;
  setTeams: (teamA: string[], teamB: string[], captainA: string, captainB: string) => void;
  updateVotes: (turfId: string, voteCounts: Record<string, number>) => void;
  setSelectedTurf: (turfId: string) => void;
  setCandidateTurfs: (turfs: TurfClient[]) => void;
  setVotingDeadline: (deadline: string | null) => void;
  setMyVote: (turfId: string | null) => void;
  setInitialVotes: (votes: { turfId: string; userId: string }[], myUserId: string) => void;
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
  candidateTurfs: [],
  votingDeadline: null,
  matchId: null,
  myVote: null,
  chatMessages: [],
};

export const useLobbyStore = create<LobbyState & LobbyActions>((set) => ({
  ...initialState,

  setLobby: (lobbyId, region, status) => set({ lobbyId, region, status }),

  setStatus: (status) => set({ status }),

  setMatchId: (matchId) => set({ matchId }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => {
      // Deduplicate: ignore if already present (can happen on Pusher reconnect)
      if (state.players.some((p) => p.userId === player.userId)) return state;
      return {
        players: [
          ...state.players,
          {
            userId: player.userId,
            name: player.name,
            image: player.image,
            karmaScore: player.karmaScore,
            position: (player as { position?: import("@/types").Position | null }).position ?? null,
            isReady: false,
            team: null,
          },
        ],
      };
    }),

  removePlayer: (userId) =>
    set((state) => ({ players: state.players.filter((p) => p.userId !== userId) })),

  setPlayerReady: (userId, isReady) =>
    set((state) => ({
      players: state.players.map((p) => (p.userId === userId ? { ...p, isReady } : p)),
    })),

  setTeams: (teamA, teamB, captainA, captainB) =>
    set((state) => ({
      teamA,
      teamB,
      captainA,
      captainB,
      players: state.players.map((p) => ({
        ...p,
        team: teamA.includes(p.userId) ? "A" : teamB.includes(p.userId) ? "B" : null,
      })),
    })),

  updateVotes: (_turfId, voteCounts) =>
    set({
      turfVotes: Object.entries(voteCounts).map(([id, count]) => ({ turfId: id, count })),
    }),

  setSelectedTurf: (turfId) => set({ selectedTurfId: turfId }),

  setCandidateTurfs: (turfs) => set({ candidateTurfs: turfs }),

  setVotingDeadline: (deadline) => set({ votingDeadline: deadline }),

  setMyVote: (turfId) => set({ myVote: turfId }),

  setInitialVotes: (votes, myUserId) => {
    const tally: Record<string, number> = {};
    let myVote: string | null = null;
    for (const v of votes) {
      tally[v.turfId] = (tally[v.turfId] ?? 0) + 1;
      if (v.userId === myUserId) myVote = v.turfId;
    }
    set({
      turfVotes: Object.entries(tally).map(([turfId, count]) => ({ turfId, count })),
      myVote,
    });
  },

  addChatMessage: (message) =>
    set((state) => {
      // Deduplicate by messageId
      if (state.chatMessages.some((m) => m.messageId === message.messageId)) return state;
      return {
        chatMessages: [
          ...state.chatMessages,
          {
            messageId: message.messageId,
            userId: message.userId,
            name: message.name,
            image: message.image,
            message: message.message,
            sentAt: message.sentAt,
          },
        ],
      };
    }),

  resetLobby: () => set(initialState),
}));
