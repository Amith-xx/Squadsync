import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Turf from "@/lib/db/models/Turf";
import { TURF_SEED_DATA } from "@/lib/data/turfs-seed";
import type { ApiResponse } from "@/types";

// POST /api/dev/seed — seed turf data (DEV only, idempotent)
// Safe to re-run: upserts by name+region, never duplicates.
export async function POST(): Promise<NextResponse<ApiResponse<{ upserted: number }>>> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  await connectToDatabase();

  let upserted = 0;

  for (const entry of TURF_SEED_DATA) {
    const result = await Turf.updateOne(
      { name: entry.name, region: entry.region },
      {
        $setOnInsert: {
          name: entry.name,
          address: entry.address,
          region: entry.region,
          pricePerHour: entry.pricePerHour,
          contactNumber: entry.contactNumber,
          images: entry.images,
          location: entry.location,
          slots: [],
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount > 0) upserted++;
  }

  return NextResponse.json({ success: true, data: { upserted } });
}

// GET /api/dev/seed — count existing turfs per region (diagnostic)
export async function GET(): Promise<NextResponse<ApiResponse<Record<string, number>>>> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  await connectToDatabase();

  const counts = await Turf.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$region", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const data: Record<string, number> = {};
  for (const row of counts) {
    data[row._id] = row.count;
  }

  return NextResponse.json({ success: true, data });
}
