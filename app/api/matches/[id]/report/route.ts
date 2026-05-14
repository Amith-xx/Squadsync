import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import type { ApiResponse } from "@/types";

// POST /api/matches/[id]/report — captain submits final score
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ status: string }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();

  // TODO (Day 5): Verify caller is captainA or captainB, save report, compare scores,
  //               auto-confirm if |goalsA-goalsB| ≤ 1, else flag as disputed
  void id;

  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
