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

  const { position, region, ...rest } = body as Record<string, unknown>;

  if (!VALID_POSITIONS.includes(position as Position)) {
    return NextResponse.json(
      { success: false, error: "Invalid position. Must be GK, DEF, MID, or FWD." },
      { status: 400 },
    );
  }

  const isGK = (position as Position) === "GK";
  const attrFields = isGK
    ? { diving: rest.diving, reflex: rest.reflex, speed: rest.speed, handling: rest.handling, physical: rest.physical }
    : { pace: rest.pace, shooting: rest.shooting, passing: rest.passing, defending: rest.defending, physical: rest.physical };

  for (const [key, val] of Object.entries(attrFields)) {
    if (typeof val !== "number" || !Number.isInteger(val) || val < 40 || val > 100) {
      return NextResponse.json(
        { success: false, error: `Attribute "${key}" must be an integer between 40 and 100.` },
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
      attributes: attrFields,
      onboardingComplete: true,
      region,
    },
    { new: true },
  );

  return NextResponse.json({ success: true });
}
