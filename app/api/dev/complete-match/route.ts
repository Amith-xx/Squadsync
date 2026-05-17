import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import Match from "@/lib/db/models/Match";
import User from "@/lib/db/models/User";
import Lobby from "@/lib/db/models/Lobby";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { applyMatchCompletionKarma } from "@/lib/utils/applyKarmaUpdates";
import type { ApiResponse } from "@/types";

// POST /api/dev/complete-match — DEV ONLY
// Body: { matchId: string }
// Auto-confirms a match with a fake 3-1 score, applies karma, marks completed.
export async function POST(req: Request): Promise<NextResponse<ApiResponse<{ matchId: string; status: string }>>> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  let matchId: string;
  try {
    const body = await req.json() as { matchId: unknown };
    if (typeof body.matchId !== "string") throw new Error("Invalid");
    matchId = body.matchId;
    if (!Types.ObjectId.isValid(matchId)) throw new Error("Invalid ID");
  } catch {
    return NextResponse.json({ success: false, error: "Invalid matchId" }, { status: 400 });
  }

  await connectToDatabase();

  const match = await Match.findById(matchId).lean();
  if (!match) {
    return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
  }

  const finalScore = { teamA: 3, teamB: 1 };

  await Match.updateOne(
    { _id: new Types.ObjectId(matchId) },
    {
      $set: {
        status: "confirmed",
        finalScore,
        scoreReportA: { goalsA: 3, goalsB: 1, submittedAt: new Date() },
        scoreReportB: { goalsA: 3, goalsB: 1, submittedAt: new Date() },
        completedAt: new Date(),
      },
    }
  );

  const allPlayerIds = [...match.teamA, ...match.teamB].map((x) => x.toString());
  await applyMatchCompletionKarma(allPlayerIds);
  await User.updateMany(
    { _id: { $in: [...match.teamA, ...match.teamB] } },
    { $inc: { matchesPlayed: 1 } }
  );
  await Lobby.updateOne({ _id: match.lobbyId }, { $set: { status: "completed" } });

  const channel = PUSHER_CHANNELS.match(matchId);
  try {
    await getPusherServer().trigger(channel, PUSHER_EVENTS.MATCH_CONFIRMED, { finalScore });
  } catch { /* Non-fatal */ }

  return NextResponse.json({ success: true, data: { matchId, status: "confirmed" } });
}
