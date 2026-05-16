import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { REGION_CODES } from "@/lib/regions";
import type { Position } from "@/types";

const VALID_POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { position, pace, shooting, passing, defending, physical, region } =
    body as Record<string, unknown>;

  if (!VALID_POSITIONS.includes(position as Position)) {
    return NextResponse.json(
      { success: false, error: "Invalid position. Must be GK, DEF, MID, or FWD." },
      { status: 400 },
    );
  }

  const attrFields = { pace, shooting, passing, defending, physical };
  for (const [key, val] of Object.entries(attrFields)) {
    if (typeof val !== "number" || !Number.isInteger(val) || val < 40 || val > 100) {
      return NextResponse.json(
        {
          success: false,
          error: `Attribute "${key}" must be an integer between 40 and 100.`,
        },
        { status: 400 },
      );
    }
  }

  if (typeof region !== "string" || !REGION_CODES.includes(region)) {
    return NextResponse.json(
      { success: false, error: "Invalid region. Please select a valid region." },
      { status: 400 },
    );
  }

  await connectToDatabase();

  await User.findByIdAndUpdate(
    session.user.id,
    {
      position: position as Position,
      attributes: { pace, shooting, passing, defending, physical },
      onboardingComplete: true,
      region,
    },
    { new: true },
  );

  return NextResponse.json({ success: true });
}
