import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Turf from "@/lib/db/models/Turf";
import type { ApiResponse, ITurf } from "@/types";

// GET /api/turfs?region=... or ?lng=...&lat=...&maxDistance=...
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<ITurf[]>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const lng = searchParams.get("lng");
  const lat = searchParams.get("lat");

  await connectToDatabase();

  // TODO (Day 4): Query by region string or 2dsphere $nearSphere
  void Turf;
  void region;
  void lng;
  void lat;

  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
