import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import type { ApiResponse, IUser } from "@/types";

export async function GET(): Promise<NextResponse<ApiResponse<Partial<IUser>>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id).lean();

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user });
}

export async function PUT(_req: NextRequest): Promise<NextResponse<ApiResponse<Partial<IUser>>>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // TODO (Day 1): Validate body with Zod, update position + attributes
  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
