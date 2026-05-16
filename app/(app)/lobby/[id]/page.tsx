import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import User from "@/lib/db/models/User";
import { LobbyClient } from "@/components/lobby/LobbyClient";
import type { LobbyClient as LobbyClientType, LobbyPlayerClient, Position, Team } from "@/types";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  if (!Types.ObjectId.isValid(id)) notFound();

  await connectToDatabase();

  const lobby = await Lobby.findById(id).lean();
  if (!lobby) notFound();

  // Populate all players' user data
  const playerIds = lobby.players.map((p) => p.userId);
  const users = await User.find({ _id: { $in: playerIds } })
    .select("name image karmaScore position")
    .lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const players: LobbyPlayerClient[] = lobby.players.map((p) => {
    const u = userMap.get(p.userId.toString());
    return {
      userId: p.userId.toString(),
      name: u?.name ?? "Unknown",
      image: u?.image ?? "",
      karmaScore: u?.karmaScore ?? 70,
      position: (u?.position as Position | null) ?? null,
      isReady: p.isReady,
      team: (p.team as Team | null) ?? null,
      joinedAt: p.joinedAt.toISOString(),
    };
  });

  const lobbyData: LobbyClientType = {
    id: lobby._id.toString(),
    status: lobby.status,
    region: lobby.region,
    players,
    teamA: (lobby.teamA ?? []).map((tid) => tid.toString()),
    teamB: (lobby.teamB ?? []).map((tid) => tid.toString()),
    captainA: lobby.captainA ? lobby.captainA.toString() : null,
    captainB: lobby.captainB ? lobby.captainB.toString() : null,
    expiresAt: lobby.expiresAt ? lobby.expiresAt.toISOString() : null,
    createdAt: (lobby.createdAt as Date).toISOString(),
  };

  return <LobbyClient lobby={lobbyData} />;
}
