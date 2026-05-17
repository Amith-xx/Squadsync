import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { resolveVoting } from "@/lib/utils/resolveVoting";
import type { ApiResponse, PusherVoteCastPayload } from "@/types";

// POST /api/lobbies/[id]/vote/turf
// Body: { turfId: string }
// Records a turf vote; one vote per player; change allowed until resolution.
// Resolves voting when all players have voted.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ voteCounts: Record<string, number> }>>> {
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

  const { turfId } = body as Record<string, unknown>;
  if (typeof turfId !== "string" || !Types.ObjectId.isValid(turfId)) {
    return NextResponse.json({ success: false, error: "Invalid turfId" }, { status: 400 });
  }

  await connectToDatabase();

  const userId = new Types.ObjectId(session.user.id);
  const turfOid = new Types.ObjectId(turfId);

  // Verify lobby is in voting state and user is a player
  const lobby = await Lobby.findOne({
    _id: new Types.ObjectId(id),
    status: "voting",
    "players.userId": userId,
  }).lean();

  if (!lobby) {
    return NextResponse.json(
      { success: false, error: "Lobby not found, not in voting phase, or you are not a player" },
      { status: 404 }
    );
  }

  // Upsert: replace previous vote or add new one
  const alreadyVoted = lobby.turfVotes.some((v) => v.userId.toString() === session.user.id);

  if (alreadyVoted) {
    await Lobby.updateOne(
      { _id: lobby._id, "turfVotes.userId": userId },
      { $set: { "turfVotes.$.turfId": turfOid } }
    );
  } else {
    await Lobby.updateOne(
      { _id: lobby._id },
      { $push: { turfVotes: { userId, turfId: turfOid } } }
    );
  }

  // Re-fetch to get updated vote tally
  const updated = await Lobby.findById(id).lean();
  if (!updated) {
    return NextResponse.json({ success: false, error: "Lobby not found" }, { status: 404 });
  }

  // Tally
  const voteCounts: Record<string, number> = {};
  for (const tv of updated.turfVotes) {
    const tid = tv.turfId.toString();
    voteCounts[tid] = (voteCounts[tid] ?? 0) + 1;
  }

  // Broadcast
  const channel = PUSHER_CHANNELS.lobby(id);
  const votePayload: PusherVoteCastPayload = {
    userId: session.user.id,
    turfId,
    voteCounts,
  };

  try {
    await getPusherServer().trigger(channel, PUSHER_EVENTS.VOTE_CAST, votePayload);
  } catch {
    // Non-fatal
  }

  // Resolve if all players have voted OR deadline has passed
  const allVoted = updated.turfVotes.length >= updated.players.length;
  const deadlinePassed = updated.votingDeadline
    ? Date.now() > updated.votingDeadline.getTime()
    : false;

  if (allVoted || deadlinePassed) {
    await resolveVoting(id);
  }

  return NextResponse.json({ success: true, data: { voteCounts } });
}
