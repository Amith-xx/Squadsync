import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Match from "@/lib/db/models/Match";
import User from "@/lib/db/models/User";
import Lobby from "@/lib/db/models/Lobby";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { applyMatchCompletionKarma } from "@/lib/utils/applyKarmaUpdates";
import type { ApiResponse, PusherScoreSubmittedPayload } from "@/types";

// POST /api/matches/[id]/report — captains submit score report
// Body: { goalsA: number, goalsB: number }
// Both reports agree (diff ≤ 1) → confirmed + +3 karma for all players
// Reports differ (diff > 1) → disputed
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ status: string }>>> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid match ID" }, { status: 400 });
  }

  let goalsA: number, goalsB: number;
  try {
    const body = await req.json() as { goalsA: unknown; goalsB: unknown };
    goalsA = Number(body.goalsA);
    goalsB = Number(body.goalsB);
    if (!Number.isInteger(goalsA) || !Number.isInteger(goalsB) || goalsA < 0 || goalsB < 0) {
      throw new Error("Invalid");
    }
  } catch {
    return NextResponse.json({ success: false, error: "Invalid score data" }, { status: 400 });
  }

  await connectToDatabase();

  const match = await Match.findById(id).lean();
  if (!match) {
    return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
  }
  if (match.status !== "pending_reports") {
    return NextResponse.json({ success: false, error: "Match already resolved" }, { status: 409 });
  }

  const myId = session.user.id;
  const isCaptainA = match.captainA.toString() === myId;
  const isCaptainB = match.captainB.toString() === myId;

  if (!isCaptainA && !isCaptainB) {
    return NextResponse.json({ success: false, error: "Only captains can report scores" }, { status: 403 });
  }

  if (isCaptainA && match.scoreReportA) {
    return NextResponse.json({ success: false, error: "Score already submitted" }, { status: 409 });
  }
  if (isCaptainB && match.scoreReportB) {
    return NextResponse.json({ success: false, error: "Score already submitted" }, { status: 409 });
  }

  const team = isCaptainA ? "A" : "B";
  const reportField = isCaptainA ? "scoreReportA" : "scoreReportB";

  await Match.updateOne(
    { _id: new Types.ObjectId(id) },
    { $set: { [reportField]: { goalsA, goalsB, submittedAt: new Date() } } }
  );

  const channel = PUSHER_CHANNELS.match(id);
  const payload: PusherScoreSubmittedPayload = { captainId: myId, team, goalsA, goalsB };
  try {
    await getPusherServer().trigger(channel, PUSHER_EVENTS.SCORE_SUBMITTED, payload);
  } catch { /* Non-fatal */ }

  const otherReport = isCaptainA ? match.scoreReportB : match.scoreReportA;
  if (!otherReport) {
    return NextResponse.json({ success: true, data: { status: "waiting_for_other" } });
  }

  // Both reports in — compare
  const diff = Math.abs(goalsA - otherReport.goalsA) + Math.abs(goalsB - otherReport.goalsB);

  if (diff <= 1) {
    const finalScore = { teamA: goalsA, teamB: goalsB };

    await Match.updateOne(
      { _id: new Types.ObjectId(id), status: "pending_reports" },
      { $set: { status: "confirmed", finalScore, completedAt: new Date() } }
    );

    const allPlayerIds = [...match.teamA, ...match.teamB].map((x) => x.toString());
    await applyMatchCompletionKarma(allPlayerIds);
    await User.updateMany(
      { _id: { $in: [...match.teamA, ...match.teamB] } },
      { $inc: { matchesPlayed: 1 } }
    );
    await Lobby.updateOne({ _id: match.lobbyId }, { $set: { status: "completed" } });

    try {
      await getPusherServer().trigger(channel, PUSHER_EVENTS.MATCH_CONFIRMED, { finalScore });
    } catch { /* Non-fatal */ }

    return NextResponse.json({ success: true, data: { status: "confirmed" } });
  } else {
    await Match.updateOne(
      { _id: new Types.ObjectId(id), status: "pending_reports" },
      { $set: { status: "disputed" } }
    );

    try {
      await getPusherServer().trigger(channel, PUSHER_EVENTS.MATCH_DISPUTED, {});
    } catch { /* Non-fatal */ }

    return NextResponse.json({ success: true, data: { status: "disputed" } });
  }
}
