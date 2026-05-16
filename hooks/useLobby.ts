"use client";

import { useEffect, useRef } from "react";
import type { Channel } from "pusher-js";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { useLobbyStore } from "@/store/lobbyStore";
import type {
  PusherPlayerJoinedPayload,
  PusherPlayerLeftPayload,
  PusherPlayerReadyPayload,
  PusherChatMessagePayload,
  PusherTeamsFormedPayload,
  PusherVoteCastPayload,
  PusherLobbyStatusChangedPayload,
} from "@/types";

// Subscribes to the Pusher presence channel for a given lobby and wires
// all real-time events into the lobbyStore. Cleanup unsubscribes on unmount.
export function useLobby(lobbyId: string | null) {
  const channelRef = useRef<Channel | null>(null);

  const addPlayer = useLobbyStore((s) => s.addPlayer);
  const removePlayer = useLobbyStore((s) => s.removePlayer);
  const setPlayerReady = useLobbyStore((s) => s.setPlayerReady);
  const setTeams = useLobbyStore((s) => s.setTeams);
  const updateVotes = useLobbyStore((s) => s.updateVotes);
  const setSelectedTurf = useLobbyStore((s) => s.setSelectedTurf);
  const addChatMessage = useLobbyStore((s) => s.addChatMessage);
  const setStatus = useLobbyStore((s) => s.setStatus);

  useEffect(() => {
    if (!lobbyId) return;

    const pusher = getPusherClient();
    const channelName = PUSHER_CHANNELS.lobby(lobbyId);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind(PUSHER_EVENTS.PLAYER_JOINED, (data: PusherPlayerJoinedPayload) => {
      addPlayer(data);
    });

    channel.bind(PUSHER_EVENTS.PLAYER_LEFT, (data: PusherPlayerLeftPayload) => {
      removePlayer(data.userId);
    });

    channel.bind(PUSHER_EVENTS.PLAYER_READY, (data: PusherPlayerReadyPayload) => {
      setPlayerReady(data.userId, data.isReady);
    });

    channel.bind(PUSHER_EVENTS.TEAMS_FORMED, (data: PusherTeamsFormedPayload) => {
      setTeams(data.teamA, data.teamB, data.captainA, data.captainB);
      setStatus("voting");
    });

    channel.bind(PUSHER_EVENTS.VOTE_CAST, (data: PusherVoteCastPayload) => {
      updateVotes(data.turfId, data.voteCounts);
    });

    channel.bind(PUSHER_EVENTS.TURF_SELECTED, (data: { turfId: string }) => {
      setSelectedTurf(data.turfId);
      setStatus("confirmed");
    });

    channel.bind(PUSHER_EVENTS.CHAT_MESSAGE, (data: PusherChatMessagePayload) => {
      addChatMessage(data);
    });

    channel.bind(PUSHER_EVENTS.LOBBY_EXPIRED, () => {
      setStatus("expired");
    });

    channel.bind(PUSHER_EVENTS.LOBBY_STATUS_CHANGED, (data: PusherLobbyStatusChangedPayload) => {
      setStatus(data.status);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [
    lobbyId,
    addPlayer,
    removePlayer,
    setPlayerReady,
    setTeams,
    updateVotes,
    setSelectedTurf,
    addChatMessage,
    setStatus,
  ]);

  return channelRef.current;
}
