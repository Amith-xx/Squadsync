"use client";

import { useEffect, useRef } from "react";
import type { Channel } from "pusher-js";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { useLobbyStore } from "@/store/lobbyStore";
import { useUserStore } from "@/store/userStore";
import type {
  PusherPlayerJoinedPayload,
  PusherPlayerLeftPayload,
  PusherPlayerReadyPayload,
  PusherChatMessagePayload,
  PusherTeamsFormedPayload,
  PusherVoteCastPayload,
  PusherLobbyStatusChangedPayload,
  PusherMatchReadyPayload,
  LobbyClient,
  Position,
} from "@/types";

// Subscribes to the Pusher presence channel for a given lobby and wires
// all real-time events into the lobbyStore.
// On Pusher reconnect, refetches full lobby state from the DB so stale
// clients recover correctly without losing any missed events.
export function useLobby(lobbyId: string | null) {
  const channelRef = useRef<Channel | null>(null);
  const hasConnectedOnce = useRef(false);

  const addPlayer    = useLobbyStore((s) => s.addPlayer);
  const removePlayer = useLobbyStore((s) => s.removePlayer);
  const setPlayerReady  = useLobbyStore((s) => s.setPlayerReady);
  const setTeams     = useLobbyStore((s) => s.setTeams);
  const updateVotes  = useLobbyStore((s) => s.updateVotes);
  const setSelectedTurf = useLobbyStore((s) => s.setSelectedTurf);
  const addChatMessage  = useLobbyStore((s) => s.addChatMessage);
  const setStatus    = useLobbyStore((s) => s.setStatus);
  const setMatchId   = useLobbyStore((s) => s.setMatchId);
  const setPlayers   = useLobbyStore((s) => s.setPlayers);
  const setCandidateTurfs = useLobbyStore((s) => s.setCandidateTurfs);
  const setVotingDeadline = useLobbyStore((s) => s.setVotingDeadline);
  const setInitialVotes   = useLobbyStore((s) => s.setInitialVotes);

  // ─── Reconnect recovery ─────────────────────────────────────────────────────
  // Called when Pusher reconnects after a disconnect. Refetches lobby state
  // from the DB so the client is never stuck on stale data.
  const userId = useUserStore((s) => s.id);

  useEffect(() => {
    if (!lobbyId) return;

    const pusher = getPusherClient();

    async function refetchLobbyState() {
      if (!lobbyId) return;
      try {
        const res = await fetch(`/api/lobbies/${lobbyId}`);
        if (!res.ok) return;
        const json = await res.json() as { success: boolean; data?: LobbyClient };
        if (!json.success || !json.data) return;

        const data = json.data;
        setStatus(data.status);
        setPlayers(
          data.players.map((p) => ({
            userId: p.userId,
            name: p.name,
            image: p.image,
            karmaScore: p.karmaScore,
            position: (p.position as Position | null) ?? null,
            isReady: p.isReady,
            team: p.team,
          }))
        );
        if (data.teamA.length > 0 && data.captainA && data.captainB) {
          setTeams(data.teamA, data.teamB, data.captainA, data.captainB);
        }
        setCandidateTurfs(data.candidateTurfs);
        setVotingDeadline(data.votingDeadline);
        if (data.turfVotes.length > 0) {
          const myId = userId;
          if (myId) setInitialVotes(data.turfVotes, myId);
        }
        if (data.selectedTurfId) setSelectedTurf(data.selectedTurfId);
        if (data.matchId) setMatchId(data.matchId);
      } catch {
        /* Non-fatal — connection still may deliver future events */
      }
    }

    function handleConnected() {
      if (!hasConnectedOnce.current) {
        hasConnectedOnce.current = true;
        return; // skip first connection — LobbyClient hydrates from server props
      }
      // Reconnected after dropout — sync state from DB
      void refetchLobbyState();
    }

    pusher.connection.bind("connected", handleConnected);

    return () => {
      pusher.connection.unbind("connected", handleConnected);
    };
  }, [
    lobbyId, userId,
    setStatus, setPlayers, setTeams, setCandidateTurfs,
    setVotingDeadline, setInitialVotes, setSelectedTurf, setMatchId,
  ]);

  // ─── Channel subscription + event bindings ──────────────────────────────────

  useEffect(() => {
    if (!lobbyId) return;

    const pusher = getPusherClient();
    const channelName = PUSHER_CHANNELS.lobby(lobbyId);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    const handlers: Array<[string, (data: unknown) => void]> = [];
    const bind = <T,>(event: string, handler: (data: T) => void) => {
      const wrapped = (data: unknown) => handler(data as T);
      channel.bind(event, wrapped);
      handlers.push([event, wrapped]);
    };

    bind<PusherPlayerJoinedPayload>(PUSHER_EVENTS.PLAYER_JOINED, (data) => addPlayer(data));
    bind<PusherPlayerLeftPayload>(PUSHER_EVENTS.PLAYER_LEFT, (data) => removePlayer(data.userId));
    bind<PusherPlayerReadyPayload>(PUSHER_EVENTS.PLAYER_READY, (data) => setPlayerReady(data.userId, data.isReady));
    bind<PusherTeamsFormedPayload>(PUSHER_EVENTS.TEAMS_FORMED, (data) => {
      setTeams(data.teamA, data.teamB, data.captainA, data.captainB);
      setStatus("voting");
    });
    bind<PusherVoteCastPayload>(PUSHER_EVENTS.VOTE_CAST, (data) => updateVotes(data.turfId, data.voteCounts));
    bind<{ turfId: string }>(PUSHER_EVENTS.TURF_SELECTED, (data) => {
      setSelectedTurf(data.turfId);
      setStatus("confirmed");
    });
    bind<PusherMatchReadyPayload>(PUSHER_EVENTS.MATCH_READY, (data) => {
      setMatchId(data.matchId);
      setStatus("active");
    });
    bind<PusherChatMessagePayload>(PUSHER_EVENTS.CHAT_MESSAGE, (data) => addChatMessage(data));
    bind<unknown>(PUSHER_EVENTS.LOBBY_EXPIRED, () => setStatus("expired"));
    bind<PusherLobbyStatusChangedPayload>(PUSHER_EVENTS.LOBBY_STATUS_CHANGED, (data) => setStatus(data.status));

    return () => {
      // Unbind ONLY this hook's handlers — usePresence shares the channel.
      for (const [event, handler] of handlers) channel.unbind(event, handler);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [
    lobbyId,
    addPlayer, removePlayer, setPlayerReady,
    setTeams, updateVotes, setSelectedTurf,
    addChatMessage, setStatus, setMatchId,
  ]);

  return channelRef.current;
}
