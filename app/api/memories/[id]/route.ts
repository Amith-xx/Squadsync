import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Memory from "@/lib/db/models/Memory";
import type { ApiResponse, MemoryClient } from "@/types";

// PATCH /api/memories/[id] — edit a memory (owner only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<MemoryClient>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  const {
    teamA, teamB, scoreA, scoreB,
    playerOfMatch, competition, matchDate,
    favoriteMoment, note,
  } = body as Record<string, unknown>;

  if (
    typeof teamA !== "string" || teamA.trim().length === 0 ||
    typeof teamB !== "string" || teamB.trim().length === 0 ||
    typeof favoriteMoment !== "string" || favoriteMoment.trim().length === 0
  ) {
    return NextResponse.json(
      { success: false, error: "teamA, teamB, and favoriteMoment are required" },
      { status: 400 }
    );
  }

  const parsedScoreA = Number(scoreA);
  const parsedScoreB = Number(scoreB);
  if (!Number.isInteger(parsedScoreA) || parsedScoreA < 0 || parsedScoreA > 99 ||
      !Number.isInteger(parsedScoreB) || parsedScoreB < 0 || parsedScoreB > 99) {
    return NextResponse.json({ success: false, error: "Invalid scores (0–99)" }, { status: 400 });
  }

  let parsedDate: Date | null = null;
  if (typeof matchDate === "string" && matchDate.trim().length > 0) {
    const d = new Date(matchDate);
    if (!isNaN(d.getTime())) parsedDate = d;
  }

  await connectToDatabase();

  const updated = await Memory.findOneAndUpdate(
    { _id: new Types.ObjectId(id), userId: new Types.ObjectId(session.user.id) },
    {
      $set: {
        teamA: teamA.trim().slice(0, 80),
        teamB: teamB.trim().slice(0, 80),
        scoreA: parsedScoreA,
        scoreB: parsedScoreB,
        playerOfMatch: typeof playerOfMatch === "string" ? playerOfMatch.trim().slice(0, 80) : "",
        competition:   typeof competition === "string" ? competition.trim().slice(0, 100) : "",
        matchDate: parsedDate,
        favoriteMoment: favoriteMoment.trim().slice(0, 500),
        note: typeof note === "string" ? note.trim().slice(0, 1000) : "",
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ success: false, error: "Memory not found" }, { status: 404 });
  }

  const data: MemoryClient = {
    id: (updated._id as Types.ObjectId).toString(),
    teamA: updated.teamA,
    teamB: updated.teamB,
    scoreA: updated.scoreA,
    scoreB: updated.scoreB,
    playerOfMatch: updated.playerOfMatch,
    competition: updated.competition,
    matchDate: updated.matchDate ? updated.matchDate.toISOString() : null,
    favoriteMoment: updated.favoriteMoment,
    note: updated.note,
    createdAt: (updated.createdAt as Date).toISOString(),
  };

  return NextResponse.json({ success: true, data });
}

// DELETE /api/memories/[id] — delete a memory (owner only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
  }

  await connectToDatabase();

  const result = await Memory.deleteOne({
    _id: new Types.ObjectId(id),
    userId: new Types.ObjectId(session.user.id),
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ success: false, error: "Memory not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { deleted: true } });
}
