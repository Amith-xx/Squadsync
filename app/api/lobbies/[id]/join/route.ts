import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import type { ApiResponse } from "@/types";

// POST /api/lobbies/[id]/join — atomic join with max-10 guard
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ joined: boolean }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();

  // TODO (Day 2): Atomic $push with $size guard (max 10), trigger player-joined Pusher event
  void id;

  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
