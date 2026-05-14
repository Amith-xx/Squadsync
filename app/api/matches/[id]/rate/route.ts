import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import type { ApiResponse } from "@/types";

// POST /api/matches/[id]/rate — submit peer ratings (thumbs up/down) for all players
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ rated: boolean }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();

  // TODO (Day 5): Save playerRatings, trigger karmaEngine after all players have rated
  void id;

  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
