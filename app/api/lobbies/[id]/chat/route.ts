import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import User from "@/lib/db/models/User";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import type { ApiResponse, PusherChatMessagePayload } from "@/types";
import { randomUUID } from "crypto";

// POST /api/lobbies/[id]/chat
// Body: { message: string }
// Ephemeral: broadcasts via Pusher only — no DB persistence.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ sent: boolean }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid lobby ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { message } = body as Record<string, unknown>;
  if (typeof message !== "string" || message.trim().length === 0 || message.length > 500) {
    return NextResponse.json(
      { success: false, error: "Message must be 1–500 characters" },
      { status: 400 }
    );
  }

  await connectToDatabase();

  // Verify user is an active player in this lobby
  const lobby = await Lobby.findOne({
    _id: new Types.ObjectId(id),
    "players.userId": new Types.ObjectId(session.user.id),
    status: { $in: ["waiting", "ready_check", "voting", "confirmed", "active"] },
  }).lean();

  if (!lobby) {
    return NextResponse.json(
      { success: false, error: "Lobby not found or you are not a player" },
      { status: 403 }
    );
  }

  const user = await User.findById(session.user.id).select("name image").lean();

  const payload: PusherChatMessagePayload = {
    messageId: randomUUID(),
    userId: session.user.id,
    name: user?.name ?? "Player",
    image: user?.image ?? "",
    message: message.trim(),
    sentAt: new Date().toISOString(),
  };

  try {
    await getPusherServer().trigger(PUSHER_CHANNELS.lobby(id), PUSHER_EVENTS.CHAT_MESSAGE, payload);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { sent: true } });
}
