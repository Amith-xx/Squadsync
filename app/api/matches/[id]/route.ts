import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Match from "@/lib/db/models/Match";
import User from "@/lib/db/models/User";
import type { ApiResponse, MatchClient, MatchPlayerClient, Position, Team } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ match: MatchClient; players: MatchPlayerClient[] }>>> {
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

  // Only match participants can fetch match details
  const myUserId = session.user.id;
  const isParticipant =
    match.teamA.some((u) => u.toString() === myUserId) ||
    match.teamB.some((u) => u.toString() === myUserId);
  if (!isParticipant) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Fetch player user data
  const allPlayerIds = [...match.teamA, ...match.teamB];
  const users = await User.find({ _id: { $in: allPlayerIds } })
    .select("name image position karmaScore")
    .lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const toPlayerClient = (uid: Types.ObjectId, team: Team): MatchPlayerClient => {
    const u = userMap.get(uid.toString());
    return {
      userId: uid.toString(),
      name: u?.name ?? "Unknown",
      image: u?.image ?? "",
      position: (u?.position as Position | null) ?? null,
      team,
      karmaScore: u?.karmaScore ?? 70,
    };
  };

  const players: MatchPlayerClient[] = [
    ...match.teamA.map((uid) => toPlayerClient(uid, "A")),
    ...match.teamB.map((uid) => toPlayerClient(uid, "B")),
  ];

  const myRatings = match.playerRatings
    .filter((r) => r.raterId.toString() === myUserId)
    .map((r) => r.ratedId.toString());

  const matchClient: MatchClient = {
    id: match._id.toString(),
    lobbyId: match.lobbyId.toString(),
    turfId: match.turfId ? match.turfId.toString() : null,
    teamA: match.teamA.map((x) => x.toString()),
    teamB: match.teamB.map((x) => x.toString()),
    captainA: match.captainA.toString(),
    captainB: match.captainB.toString(),
    scoreReportA: match.scoreReportA
      ? {
          goalsA: match.scoreReportA.goalsA,
          goalsB: match.scoreReportA.goalsB,
          submittedAt: match.scoreReportA.submittedAt.toISOString(),
        }
      : null,
    scoreReportB: match.scoreReportB
      ? {
          goalsA: match.scoreReportB.goalsA,
          goalsB: match.scoreReportB.goalsB,
          submittedAt: match.scoreReportB.submittedAt.toISOString(),
        }
      : null,
    finalScore: match.finalScore ?? null,
    status: match.status,
    attendanceConfirmed: match.attendanceConfirmed.map((x) => x.toString()),
    myRatings,
    createdAt: (match.createdAt as Date).toISOString(),
    completedAt: match.completedAt ? match.completedAt.toISOString() : null,
  };

  return NextResponse.json({ success: true, data: { match: matchClient, players } });
}
