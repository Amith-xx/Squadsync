import { type NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import User from "@/lib/db/models/User";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { REGION_CODES } from "@/lib/regions";
import type { ApiResponse, LobbyListItem, LobbyClient, Position } from "@/types";

const LOBBY_TTL_MS = 30 * 60 * 1000; // 30 minutes

// GET /api/lobbies?region=X — list open waiting lobbies for a region
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<LobbyListItem[]>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");

  if (!region) {
    return NextResponse.json({ success: false, error: "region query param required" }, { status: 400 });
  }

  await connectToDatabase();

  const lobbies = await Lobby.find({ region, status: "waiting" })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const result: LobbyListItem[] = lobbies.map((lobby) => ({
    id: lobby._id.toString(),
    status: lobby.status,
    region: lobby.region,
    playerCount: lobby.players.length,
    expiresAt: lobby.expiresAt ? lobby.expiresAt.toISOString() : null,
    createdAt: (lobby.createdAt as Date).toISOString(),
  }));

  return NextResponse.json({ success: true, data: result });
}

// POST /api/lobbies — create a new lobby, auto-join creator as first player
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<LobbyClient>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  // Fetch user to verify onboarding and get region
  const user = await User.findById(session.user.id)
    .select("name image karmaScore position onboardingComplete region")
    .lean();

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }
  if (!user.onboardingComplete) {
    return NextResponse.json({ success: false, error: "Complete onboarding first" }, { status: 403 });
  }

  // Allow region override from body, fall back to user's saved region
  let bodyRegion: string | undefined;
  try {
    const body = await req.json() as Record<string, unknown>;
    if (typeof body.region === "string") bodyRegion = body.region;
  } catch {
    // no body — use user region
  }

  const region = bodyRegion ?? user.region;
  if (!region || !REGION_CODES.includes(region)) {
    return NextResponse.json({ success: false, error: "Valid region required" }, { status: 400 });
  }

  // Check the user isn't already in an active lobby
  const existingLobby = await Lobby.findOne({
    "players.userId": new Types.ObjectId(session.user.id),
    status: { $in: ["waiting", "ready_check", "voting", "confirmed"] },
  }).lean();

  if (existingLobby) {
    return NextResponse.json(
      { success: false, error: "You are already in a lobby", code: "ALREADY_IN_LOBBY" },
      { status: 409 }
    );
  }

  const lobby = await Lobby.create({
    region,
    status: "waiting",
    players: [
      {
        userId: new Types.ObjectId(session.user.id),
        joinedAt: new Date(),
        isReady: false,
        team: null,
      },
    ],
    expiresAt: new Date(Date.now() + LOBBY_TTL_MS),
  });

  // Trigger Pusher region event so other dashboard users can see the new lobby
  try {
    await getPusherServer().trigger(
      PUSHER_CHANNELS.region(region),
      PUSHER_EVENTS.LOBBY_CREATED,
      { lobbyId: lobby._id.toString(), region, playerCount: 1 }
    );
  } catch {
    // Non-fatal — lobby was created, Pusher event failure shouldn't block response
  }

  const response: LobbyClient = {
    id: lobby._id.toString(),
    status: lobby.status,
    region: lobby.region,
    players: [
      {
        userId: session.user.id,
        name: user.name,
        image: user.image ?? "",
        karmaScore: user.karmaScore,
        position: (user.position as Position | null) ?? null,
        isReady: false,
        team: null,
        joinedAt: new Date().toISOString(),
      },
    ],
    teamA: [],
    teamB: [],
    captainA: null,
    captainB: null,
    expiresAt: lobby.expiresAt ? lobby.expiresAt.toISOString() : null,
    createdAt: (lobby.createdAt as Date).toISOString(),
  };

  return NextResponse.json({ success: true, data: response }, { status: 201 });
}
