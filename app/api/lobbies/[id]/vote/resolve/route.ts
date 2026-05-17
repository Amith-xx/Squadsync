import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import { resolveVoting } from "@/lib/utils/resolveVoting";
import type { ApiResponse } from "@/types";

// POST /api/lobbies/[id]/vote/resolve
// Called by the client voting countdown when the timer expires.
// Resolves voting if deadline has passed (or all players voted).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ resolved: boolean }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid lobby ID" }, { status: 400 });
  }

  await connectToDatabase();

  const lobby = await Lobby.findOne({
    _id: new Types.ObjectId(id),
    status: "voting",
    "players.userId": new Types.ObjectId(session.user.id),
  }).lean();

  if (!lobby) {
    // Already resolved or user not in lobby — not an error
    return NextResponse.json({ success: true, data: { resolved: false } });
  }

  const deadlinePassed = lobby.votingDeadline
    ? Date.now() > lobby.votingDeadline.getTime()
    : true;

  if (!deadlinePassed) {
    return NextResponse.json(
      { success: false, error: "Voting deadline has not passed yet" },
      { status: 400 }
    );
  }

  const resolved = await resolveVoting(id);
  return NextResponse.json({ success: true, data: { resolved } });
}
