"use client";

import { useEffect, useState } from "react";
import { getPusherClient, PUSHER_CHANNELS } from "@/lib/pusher";
import type { PresenceChannel } from "pusher-js";

interface PresenceMember {
  id: string;
  info: {
    name: string;
    image: string;
    karmaScore: number;
  };
}

interface UsePresenceReturn {
  members: PresenceMember[];
  myId: string | null;
  memberCount: number;
}

// Tracks which members are currently online in a Pusher presence channel.
// Distinct from useLobby — this provides the live-who's-connected view.
export function usePresence(lobbyId: string | null): UsePresenceReturn {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    if (!lobbyId) return;

    const pusher = getPusherClient();
    const channelName = PUSHER_CHANNELS.lobby(lobbyId);
    const channel = pusher.subscribe(channelName) as PresenceChannel;

    channel.bind("pusher:subscription_succeeded", (data: { me: PresenceMember; members: Record<string, PresenceMember["info"]> }) => {
      setMyId(data.me.id);
      const memberList = Object.entries(data.members).map(([id, info]) => ({
        id,
        info,
      }));
      setMembers(memberList);
    });

    channel.bind("pusher:member_added", (member: PresenceMember) => {
      setMembers((prev) => [...prev, member]);
    });

    channel.bind("pusher:member_removed", (member: PresenceMember) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [lobbyId]);

  return { members, myId, memberCount: members.length };
}
