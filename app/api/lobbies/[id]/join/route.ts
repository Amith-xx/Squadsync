import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import User from "@/lib/db/models/User";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import type { ApiResponse, PusherPlayerJoinedPayload } from "@/types";

const MAX_PLAYERS = 10;

// POST /api/lobbies/[id]/join — atomically join a lobby
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ joined: boolean; lobbyId: string }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid lobby ID" }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findById(session.user.id)
    .select("name image karmaScore onboardingComplete")
    .lean();

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }
  if (!user.onboardingComplete) {
    return NextResponse.json({ success: false, error: "Complete onboarding first" }, { status: 403 });
  }

  const userId = new Types.ObjectId(session.user.id);

  // Atomic update: only succeeds if lobby is waiting, user not already in it, and under max capacity
  const updated = await Lobby.findOneAndUpdate(
    {
      _id: new Types.ObjectId(id),
      status: "waiting",
      "players.userId": { $ne: userId },
      $expr: { $lt: [{ $size: "$players" }, MAX_PLAYERS] },
    },
    {
      $push: {
        players: {
          userId,
          joinedAt: new Date(),
          isReady: false,
          team: null,
        },
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    // Determine why the join failed for a specific error message
    const lobby = await Lobby.findById(id).lean();
    if (!lobby) {
      return NextResponse.json({ success: false, error: "Lobby not found" }, { status: 404 });
    }
    if (lobby.players.some((p) => p.userId.toString() === session.user.id)) {
      return NextResponse.json({ success: false, error: "Already in this lobby", code: "ALREADY_JOINED" }, { status: 409 });
    }
    if (lobby.players.length >= MAX_PLAYERS) {
      return NextResponse.json({ success: false, error: "Lobby is full" }, { status: 409 });
    }
    if (lobby.status !== "waiting") {
      return NextResponse.json({ success: false, error: "Lobby is no longer accepting players" }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Could not join lobby" }, { status: 409 });
  }

  // Trigger Pusher player-joined event
  const payload: PusherPlayerJoinedPayload = {
    userId: session.user.id,
    name: user.name,
    image: user.image ?? "",
    karmaScore: user.karmaScore,
  };

  try {
    await getPusherServer().trigger(
      PUSHER_CHANNELS.lobby(id),
      PUSHER_EVENTS.PLAYER_JOINED,
      payload
    );
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ success: true, data: { joined: true, lobbyId: id } });
}
