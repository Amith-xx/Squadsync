import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Match from "@/lib/db/models/Match";
import type { ApiResponse } from "@/types";

// POST /api/matches/[id]/attend — player confirms physical attendance
// Idempotent — safe to call multiple times.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ confirmed: boolean }>>> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid match ID" }, { status: 400 });
  }

  await connectToDatabase();

  const match = await Match.findById(id).lean();
  if (!match) {
    return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
  }

  const myId = session.user.id;
  const allPlayers = [...match.teamA, ...match.teamB].map((x) => x.toString());
  if (!allPlayers.includes(myId)) {
    return NextResponse.json({ success: false, error: "Not a match participant" }, { status: 403 });
  }

  const alreadyConfirmed = match.attendanceConfirmed.some((x) => x.toString() === myId);
  if (alreadyConfirmed) {
    return NextResponse.json({ success: true, data: { confirmed: true } });
  }

  await Match.updateOne(
    { _id: new Types.ObjectId(id) },
    { $addToSet: { attendanceConfirmed: new Types.ObjectId(myId) } }
  );

  return NextResponse.json({ success: true, data: { confirmed: true } });
}
