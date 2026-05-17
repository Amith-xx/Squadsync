import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import type { ApiResponse, PusherPlayerLeftPayload } from "@/types";

// POST /api/lobbies/[id]/leave — remove the current user from a lobby.
// Safe to call multiple times (idempotent: 200 if already left).
// Also handles sendBeacon calls from beforeunload (no auth cookie needed
// for beacon — handled gracefully by returning 200 silently).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ left: boolean }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    // Beacon calls after session expires — respond silently
    return NextResponse.json({ success: true, data: { left: false } });
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid lobby ID" }, { status: 400 });
  }

  await connectToDatabase();

  const userId = new Types.ObjectId(session.user.id);

  const updated = await Lobby.findOneAndUpdate(
    {
      _id: new Types.ObjectId(id),
      // Only pull from lobbies still in joinable states
      status: { $in: ["waiting", "ready_check", "voting", "confirmed", "active"] },
    },
    { $pull: { players: { userId } } },
    { new: true }
  ).lean();

  if (!updated) {
    // Already left or lobby doesn't exist — return success silently
    return NextResponse.json({ success: true, data: { left: true } });
  }

  // Auto-destroy if lobby is now empty and still in an early stage
  if (
    updated.players.length === 0 &&
    ["waiting", "ready_check"].includes(updated.status)
  ) {
    await Lobby.findByIdAndDelete(id);
  }

  // Trigger Pusher player-left event (best effort)
  const payload: PusherPlayerLeftPayload = { userId: session.user.id };
  try {
    await getPusherServer().trigger(
      PUSHER_CHANNELS.lobby(id),
      PUSHER_EVENTS.PLAYER_LEFT,
      payload
    );
  } catch {
    /* Non-fatal */
  }

  return NextResponse.json({ success: true, data: { left: true } });
}
