import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import User from "@/lib/db/models/User";
import type { ApiResponse, LobbyClient, LobbyPlayerClient, Position, Team } from "@/types";

// GET /api/lobbies/[id] — fetch lobby with populated player details
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<LobbyClient>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid lobby ID" }, { status: 400 });
  }

  await connectToDatabase();

  const lobby = await Lobby.findById(id).lean();
  if (!lobby) {
    return NextResponse.json({ success: false, error: "Lobby not found" }, { status: 404 });
  }

  // Populate player user data in a single query
  const playerIds = lobby.players.map((p) => p.userId);
  const users = await User.find({ _id: { $in: playerIds } })
    .select("name image karmaScore position")
    .lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const players: LobbyPlayerClient[] = lobby.players.map((p) => {
    const user = userMap.get(p.userId.toString());
    return {
      userId: p.userId.toString(),
      name: user?.name ?? "Unknown",
      image: user?.image ?? "",
      karmaScore: user?.karmaScore ?? 70,
      position: (user?.position as Position | null) ?? null,
      isReady: p.isReady,
      team: (p.team as Team | null) ?? null,
      joinedAt: p.joinedAt.toISOString(),
    };
  });

  const response: LobbyClient = {
    id: lobby._id.toString(),
    status: lobby.status,
    region: lobby.region,
    players,
    teamA: (lobby.teamA ?? []).map((id) => id.toString()),
    teamB: (lobby.teamB ?? []).map((id) => id.toString()),
    captainA: lobby.captainA ? lobby.captainA.toString() : null,
    captainB: lobby.captainB ? lobby.captainB.toString() : null,
    expiresAt: lobby.expiresAt ? lobby.expiresAt.toISOString() : null,
    createdAt: (lobby.createdAt as Date).toISOString(),
  };

  return NextResponse.json({ success: true, data: response });
}
