import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Match from "@/lib/db/models/Match";
import { applyRatingKarmaDelta } from "@/lib/utils/applyKarmaUpdates";
import type { ApiResponse } from "@/types";

// POST /api/matches/[id]/rate — submit a single peer rating
// Body: { ratedId: string; thumbsUp: boolean }
// One rating per rater per rated player. Karma delta applied immediately.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ rated: boolean }>>> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid match ID" }, { status: 400 });
  }

  let ratedId: string;
  let thumbsUp: boolean;
  try {
    const body = await req.json() as { ratedId: unknown; thumbsUp: unknown };
    if (typeof body.ratedId !== "string" || typeof body.thumbsUp !== "boolean") {
      throw new Error("Invalid");
    }
    ratedId = body.ratedId;
    thumbsUp = body.thumbsUp;
    if (!Types.ObjectId.isValid(ratedId)) throw new Error("Invalid ratedId");
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const raterId = session.user.id;
  if (raterId === ratedId) {
    return NextResponse.json({ success: false, error: "Cannot rate yourself" }, { status: 400 });
  }

  await connectToDatabase();

  const match = await Match.findById(id).lean();
  if (!match) {
    return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
  }

  // Rater must be in the match
  const allPlayers = [...match.teamA, ...match.teamB].map((x) => x.toString());
  if (!allPlayers.includes(raterId)) {
    return NextResponse.json({ success: false, error: "Not a match participant" }, { status: 403 });
  }
  if (!allPlayers.includes(ratedId)) {
    return NextResponse.json({ success: false, error: "Rated player not in this match" }, { status: 400 });
  }

  // Prevent duplicate rating
  const alreadyRated = match.playerRatings.some(
    (r) => r.raterId.toString() === raterId && r.ratedId.toString() === ratedId
  );
  if (alreadyRated) {
    return NextResponse.json({ success: false, error: "Already rated this player" }, { status: 409 });
  }

  await Match.updateOne(
    { _id: new Types.ObjectId(id) },
    {
      $push: {
        playerRatings: {
          raterId: new Types.ObjectId(raterId),
          ratedId: new Types.ObjectId(ratedId),
          thumbsUp,
        },
      },
    }
  );

  // Apply karma delta immediately
  await applyRatingKarmaDelta({ userId: ratedId, thumbsUp });

  return NextResponse.json({ success: true, data: { rated: true } });
}
