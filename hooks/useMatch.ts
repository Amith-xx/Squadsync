"use client";

import { useEffect, useState } from "react";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import type { MatchStatus } from "@/types";

interface UseMatchReturn {
  status: MatchStatus | null;
  isConfirmed: boolean;
  isDisputed: boolean;
}

// Subscribes to the private match channel for post-match score and rating events.
export function useMatch(matchId: string | null): UseMatchReturn {
  const [status, setStatus] = useState<MatchStatus | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const pusher = getPusherClient();
    const channelName = PUSHER_CHANNELS.match(matchId);
    const channel = pusher.subscribe(channelName);

    channel.bind(PUSHER_EVENTS.MATCH_CONFIRMED, () => {
      setStatus("confirmed");
    });

    channel.bind(PUSHER_EVENTS.MATCH_DISPUTED, () => {
      setStatus("disputed");
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [matchId]);

  return {
    status,
    isConfirmed: status === "confirmed",
    isDisputed: status === "disputed",
  };
}
