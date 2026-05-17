import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import User from "@/lib/db/models/User";
import Turf from "@/lib/db/models/Turf";
import { TURF_SEED_DATA } from "@/lib/data/turfs-seed";
import type { ApiResponse } from "@/types";

// POST /api/dev/reset — DEV ONLY
// Deletes all lobbies, matches, and bot users, then re-seeds turfs.
// Real user accounts (non-bot email) are preserved.
export async function POST(): Promise<NextResponse<ApiResponse<{
  lobbiesDeleted: number;
  botUsersDeleted: number;
  turfsSeeded: number;
}>>> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  await connectToDatabase();

  const [lobbiesResult, botsResult] = await Promise.all([
    Lobby.deleteMany({}),
    User.deleteMany({ email: /@squadsync\.bot$/ }),
  ]);

  // Re-seed turfs (upsert — safe to run multiple times)
  let turfsSeeded = 0;
  for (const entry of TURF_SEED_DATA) {
    const result = await Turf.updateOne(
      { name: entry.name, region: entry.region },
      {
        $set: {
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
    if (result.upsertedCount > 0 || result.modifiedCount > 0) turfsSeeded++;
  }

  return NextResponse.json({
    success: true,
    data: {
      lobbiesDeleted: lobbiesResult.deletedCount,
      botUsersDeleted: botsResult.deletedCount,
      turfsSeeded,
    },
  });
}
