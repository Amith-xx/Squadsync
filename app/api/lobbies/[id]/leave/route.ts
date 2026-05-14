import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import type { ApiResponse } from "@/types";

// POST /api/lobbies/[id]/leave
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ left: boolean }>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();

  // TODO (Day 2): Remove player from lobby, trigger player-left Pusher event
  void id;

  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
