import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { runTeamBalancing } from "@/lib/utils/runTeamBalancing";
import type { ApiResponse, PusherPlayerReadyPayload } from "@/types";

// POST /api/lobbies/[id]/ready — toggle ready state; auto-triggers team balancing when all 10 are ready
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ isReady: boolean }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid lobby ID" }, { status: 400 });
  }

  await connectToDatabase();

  const userId = new Types.ObjectId(session.user.id);

  // Find lobby where the calling user is an active player
  const lobby = await Lobby.findOne({
    _id: new Types.ObjectId(id),
    "players.userId": userId,
    status: { $in: ["waiting", "ready_check"] },
  }).lean();

  if (!lobby) {
    return NextResponse.json(
      { success: false, error: "Lobby not found or you are not in it" },
      { status: 404 }
    );
  }

  const player = lobby.players.find((p) => p.userId.toString() === session.user.id);
  if (!player) {
    return NextResponse.json({ success: false, error: "Not in lobby" }, { status: 403 });
  }

  const newReadyState = !player.isReady;

  // Atomic positional update of this player's isReady field
  await Lobby.updateOne(
    { _id: lobby._id, "players.userId": userId },
    { $set: { "players.$.isReady": newReadyState } }
  );

  // Broadcast ready toggle immediately to all connected clients
  const channel = PUSHER_CHANNELS.lobby(id);
  const readyPayload: PusherPlayerReadyPayload = {
    userId: session.user.id,
    isReady: newReadyState,
  };

  try {
    await getPusherServer().trigger(channel, PUSHER_EVENTS.PLAYER_READY, readyPayload);
  } catch {
    // Non-fatal
  }

  // Re-fetch the updated lobby state to evaluate transition conditions
  const updated = await Lobby.findById(id).lean();
  if (!updated) {
    return NextResponse.json({ success: true, data: { isReady: newReadyState } });
  }

  const playerCount = updated.players.length;
  const readyCount = updated.players.filter((p) => p.isReady).length;
  const allReady = playerCount === 10 && readyCount === 10;

  if (allReady) {
    // All 10 ready — attempt atomic team balancing.
    // runTeamBalancing guards against double-trigger with a status-conditional update.
    await runTeamBalancing(id);
  } else if (playerCount === 10 && updated.status === "waiting") {
    // Lobby just filled to 10 but not all ready — advance to ready_check so
    // the join route (which only accepts "waiting" lobbies) blocks new joiners.
    await Lobby.updateOne({ _id: id }, { $set: { status: "ready_check" } });
    try {
      await getPusherServer().trigger(channel, PUSHER_EVENTS.LOBBY_STATUS_CHANGED, {
        status: "ready_check",
      });
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({ success: true, data: { isReady: newReadyState } });
}
