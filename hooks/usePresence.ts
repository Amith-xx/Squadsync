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
// Shares the channel with useLobby — both call subscribe() (idempotent) but
// only useLobby owns unsubscribe(). On cleanup we only unbind the specific
// presence handlers so we don't tear down the shared channel.
export function usePresence(lobbyId: string | null): UsePresenceReturn {
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    if (!lobbyId) return;

    const pusher = getPusherClient();
    const channelName = PUSHER_CHANNELS.lobby(lobbyId);
    const channel = pusher.subscribe(channelName) as PresenceChannel;

    const handleSubscribed = (data: { me: PresenceMember; members: Record<string, PresenceMember["info"]> }) => {
      setMyId(data.me.id);
      const memberList = Object.entries(data.members).map(([id, info]) => ({
        id,
        info,
      }));
      setMembers(memberList);
    };

    const handleAdded = (member: PresenceMember) => {
      setMembers((prev) => prev.some((m) => m.id === member.id) ? prev : [...prev, member]);
    };

    const handleRemoved = (member: PresenceMember) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    };

    channel.bind("pusher:subscription_succeeded", handleSubscribed);
    channel.bind("pusher:member_added", handleAdded);
    channel.bind("pusher:member_removed", handleRemoved);

    return () => {
      // Unbind ONLY our own handlers — never unsubscribe (useLobby owns it).
      channel.unbind("pusher:subscription_succeeded", handleSubscribed);
      channel.unbind("pusher:member_added", handleAdded);
      channel.unbind("pusher:member_removed", handleRemoved);
    };
  }, [lobbyId]);

  return { members, myId, memberCount: members.length };
}
