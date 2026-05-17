import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import Turf from "@/lib/db/models/Turf";
import type { ApiResponse, TurfClient } from "@/types";

// GET /api/turfs?region=... — list turfs for a region (up to 5)
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<TurfClient[]>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const region = new URL(req.url).searchParams.get("region");
  if (!region) {
    return NextResponse.json({ success: false, error: "region is required" }, { status: 400 });
  }

  await connectToDatabase();

  const turfs = await Turf.find({ region }).limit(5).lean();

  const data: TurfClient[] = turfs.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    address: t.address,
    region: t.region,
    images: t.images ?? [],
    pricePerHour: t.pricePerHour,
    contactNumber: t.contactNumber ?? "",
  }));

  return NextResponse.json({ success: true, data });
}
