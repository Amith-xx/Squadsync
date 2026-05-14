import PusherServer from "pusher";
import PusherClient from "pusher-js";

// ─── Server Instance (API routes only — never import in Client Components) ────

let pusherServerInstance: PusherServer | null = null;

export function getPusherServer(): PusherServer {
  if (pusherServerInstance) return pusherServerInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error("Missing Pusher server environment variables");
  }

  pusherServerInstance = new PusherServer({ appId, key, secret, cluster, useTLS: true });
  return pusherServerInstance;
}

// ─── Client Instance (Client Components only) ─────────────────────────────────

let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (pusherClientInstance) return pusherClientInstance;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    throw new Error("Missing Pusher client environment variables");
  }

  pusherClientInstance = new PusherClient(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
    authTransport: "ajax",
  });

  return pusherClientInstance;
}

// ─── Channel Name Helpers ─────────────────────────────────────────────────────

export const PUSHER_CHANNELS = {
  lobby: (lobbyId: string) => `presence-lobby-${lobbyId}`,
  match: (matchId: string) => `private-match-${matchId}`,
  region: (regionCode: string) => `public-region-${regionCode}`,
} as const;

// ─── Event Name Constants ─────────────────────────────────────────────────────

export const PUSHER_EVENTS = {
  PLAYER_JOINED: "player-joined",
  PLAYER_LEFT: "player-left",
  PLAYER_READY: "player-ready",
  CHAT_MESSAGE: "chat-message",
  TEAMS_FORMED: "teams-formed",
  VOTE_CAST: "vote-cast",
  TURF_SELECTED: "turf-selected",
  SCORE_SUBMITTED: "score-submitted",
  MATCH_CONFIRMED: "match-confirmed",
  MATCH_DISPUTED: "match-disputed",
  LOBBY_CREATED: "lobby-created",
  LOBBY_AVAILABLE: "lobby-available",
  LOBBY_EXPIRED: "lobby-expired",
} as const;

export type PusherEvent = (typeof PUSHER_EVENTS)[keyof typeof PUSHER_EVENTS];
