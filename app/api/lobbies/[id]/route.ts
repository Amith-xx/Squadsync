import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import Match from "@/lib/db/models/Match";
import User from "@/lib/db/models/User";
import Turf from "@/lib/db/models/Turf";
import type { ApiResponse, LobbyClient, LobbyPlayerClient, TurfClient, Position, Team } from "@/types";

// GET /api/lobbies/[id] — fetch lobby with populated player + turf details
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

  // Populate player user data
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

  // Fetch candidate turfs if present
  const candidateTurfs: TurfClient[] = [];
  if (lobby.candidateTurfIds && lobby.candidateTurfIds.length > 0) {
    const turfs = await Turf.find({ _id: { $in: lobby.candidateTurfIds } }).lean();
    // Preserve original order
    for (const oid of lobby.candidateTurfIds) {
      const t = turfs.find((x) => x._id.toString() === oid.toString());
      if (t) {
        candidateTurfs.push({
          id: t._id.toString(),
          name: t.name,
          address: t.address,
          region: t.region,
          images: t.images ?? [],
          pricePerHour: t.pricePerHour,
          contactNumber: t.contactNumber ?? "",
        });
      }
    }
  }

  // Resolve matchId for lobbies past voting — clients reconnecting after the
  // match was created need this to navigate to /match/[id] correctly.
  let matchId: string | null = null;
  if (["confirmed", "active", "completed"].includes(lobby.status)) {
    const m = await Match.findOne({ lobbyId: lobby._id }).select("_id").lean();
    if (m) matchId = (m._id as Types.ObjectId).toString();
  }

  const response: LobbyClient = {
    id: lobby._id.toString(),
    status: lobby.status,
    region: lobby.region,
    players,
    teamA: (lobby.teamA ?? []).map((oid) => oid.toString()),
    teamB: (lobby.teamB ?? []).map((oid) => oid.toString()),
    captainA: lobby.captainA ? lobby.captainA.toString() : null,
    captainB: lobby.captainB ? lobby.captainB.toString() : null,
    turfVotes: lobby.turfVotes.map((v) => ({
      turfId: v.turfId.toString(),
      userId: v.userId.toString(),
    })),
    selectedTurfId: lobby.selectedTurf ? lobby.selectedTurf.toString() : null,
    candidateTurfs,
    votingDeadline: lobby.votingDeadline ? lobby.votingDeadline.toISOString() : null,
    matchId,
    expiresAt: lobby.expiresAt ? lobby.expiresAt.toISOString() : null,
    createdAt: (lobby.createdAt as Date).toISOString(),
  };

  return NextResponse.json({ success: true, data: response });
}
