"use client";

import { useEffect, useState } from "react";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import type { MatchStatus } from "@/types";

interface UseMatchReturn {
  status: MatchStatus | null;
  finalScore: { teamA: number; teamB: number } | null;
  isConfirmed: boolean;
  isDisputed: boolean;
}

// Subscribes to the private match channel for post-match score and rating events.
// MATCH_CONFIRMED carries the final score so the local UI can render it
// without an extra refetch when the other captain's report lands.
export function useMatch(matchId: string | null): UseMatchReturn {
  const [status, setStatus] = useState<MatchStatus | null>(null);
  const [finalScore, setFinalScore] = useState<{ teamA: number; teamB: number } | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const pusher = getPusherClient();
    const channelName = PUSHER_CHANNELS.match(matchId);
    const channel = pusher.subscribe(channelName);

    const handleConfirmed = (data: { finalScore?: { teamA: number; teamB: number } }) => {
      setStatus("confirmed");
      if (data?.finalScore) setFinalScore(data.finalScore);
    };

    const handleDisputed = () => {
      setStatus("disputed");
    };

    channel.bind(PUSHER_EVENTS.MATCH_CONFIRMED, handleConfirmed);
    channel.bind(PUSHER_EVENTS.MATCH_DISPUTED, handleDisputed);

    return () => {
      channel.unbind(PUSHER_EVENTS.MATCH_CONFIRMED, handleConfirmed);
      channel.unbind(PUSHER_EVENTS.MATCH_DISPUTED, handleDisputed);
      pusher.unsubscribe(channelName);
    };
  }, [matchId]);

  return {
    status,
    finalScore,
    isConfirmed: status === "confirmed",
    isDisputed: status === "disputed",
  };
}
