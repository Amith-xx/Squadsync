import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import type { ApiResponse, PusherPlayerLeftPayload } from "@/types";

// POST /api/lobbies/[id]/leave — remove the current user from a lobby
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ left: boolean }>>> {
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

  const updated = await Lobby.findByIdAndUpdate(
    id,
    { $pull: { players: { userId } } },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Lobby not found" }, { status: 404 });
  }

  // Delete the lobby if it is now empty
  if (updated.players.length === 0) {
    await Lobby.findByIdAndDelete(id);
  }

  // Trigger Pusher player-left event
  const payload: PusherPlayerLeftPayload = { userId: session.user.id };

  try {
    await getPusherServer().trigger(
      PUSHER_CHANNELS.lobby(id),
      PUSHER_EVENTS.PLAYER_LEFT,
      payload
    );
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ success: true, data: { left: true } });
}
