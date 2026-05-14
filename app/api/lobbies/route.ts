import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import type { ApiResponse, ILobby } from "@/types";

// GET /api/lobbies — list open lobbies for the user's region
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<ILobby[]>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");

  if (!region) {
    return NextResponse.json({ success: false, error: "region query param required" }, { status: 400 });
  }

  await connectToDatabase();

  void region;
  // TODO (Day 2): Query lobbies by region + status='waiting', sort by createdAt
  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}

// POST /api/lobbies — create a new matchmaking lobby
export async function POST(_req: NextRequest): Promise<NextResponse<ApiResponse<ILobby>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  // TODO (Day 2): Create lobby, set expiresAt = now + 10min, trigger Pusher lobby-created
  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
