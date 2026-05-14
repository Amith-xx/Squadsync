import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import type { ApiResponse } from "@/types";

// POST /api/matches/[id]/attend — player confirms physical attendance
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ confirmed: boolean }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();

  // TODO (Day 5): Add userId to attendanceConfirmed; no-show detection runs 30 min post-kickoff
  void id;

  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
