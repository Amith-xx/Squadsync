import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Memory from "@/lib/db/models/Memory";
import type { ApiResponse, MemoryClient } from "@/types";

function serializeMemory(m: {
  _id: Types.ObjectId;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  playerOfMatch: string;
  competition: string;
  matchDate: Date | null;
  favoriteMoment: string;
  note: string;
  createdAt: Date;
}): MemoryClient {
  return {
    id: m._id.toString(),
    teamA: m.teamA,
    teamB: m.teamB,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    playerOfMatch: m.playerOfMatch,
    competition: m.competition,
    matchDate: m.matchDate ? m.matchDate.toISOString() : null,
    favoriteMoment: m.favoriteMoment,
    note: m.note,
    createdAt: (m.createdAt as Date).toISOString(),
  };
}

// GET /api/memories — list all memories for current user
export async function GET(): Promise<NextResponse<ApiResponse<MemoryClient[]>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const memories = await Memory.find({ userId: new Types.ObjectId(session.user.id) })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    success: true,
    data: memories.map((m) =>
      serializeMemory({
        ...m,
        matchDate: m.matchDate ?? null,
        createdAt: m.createdAt as Date,
      })
    ),
  });
}

// POST /api/memories — create a new memory
export async function POST(req: Request): Promise<NextResponse<ApiResponse<MemoryClient>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

  const memory = await Memory.create({
    userId: new Types.ObjectId(session.user.id),
    teamA: teamA.trim().slice(0, 80),
    teamB: teamB.trim().slice(0, 80),
    scoreA: parsedScoreA,
    scoreB: parsedScoreB,
    playerOfMatch: typeof playerOfMatch === "string" ? playerOfMatch.trim().slice(0, 80) : "",
    competition:   typeof competition === "string" ? competition.trim().slice(0, 100) : "",
    matchDate: parsedDate,
    favoriteMoment: favoriteMoment.trim().slice(0, 500),
    note: typeof note === "string" ? note.trim().slice(0, 1000) : "",
  });

  return NextResponse.json(
    {
      success: true,
      data: serializeMemory({
        _id: memory._id as Types.ObjectId,
        teamA: memory.teamA,
        teamB: memory.teamB,
        scoreA: memory.scoreA,
        scoreB: memory.scoreB,
        playerOfMatch: memory.playerOfMatch,
        competition: memory.competition,
        matchDate: memory.matchDate ?? null,
        favoriteMoment: memory.favoriteMoment,
        note: memory.note,
        createdAt: memory.createdAt as Date,
      }),
    },
    { status: 201 }
  );
}
