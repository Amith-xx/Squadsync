import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPusherServer } from "@/lib/pusher";

// POST /api/pusher/auth — authenticates private and presence channel subscriptions.
// This endpoint is CRITICAL: Pusher calls it server-side before granting channel access.
// Without this, presence channels silently fail (PRD §16 — #1 source of real-time bugs).
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json(
      { error: "Missing socket_id or channel_name" },
      { status: 400 }
    );
  }

  const pusher = getPusherServer();

  if (channelName.startsWith("presence-")) {
    const presenceData = {
      user_id: session.user.id,
      user_info: {
        name: session.user.name,
        image: session.user.image,
      },
    };

    const authResponse = pusher.authorizeChannel(socketId, channelName, presenceData);
    return NextResponse.json(authResponse);
  }

  if (channelName.startsWith("private-")) {
    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  }

  return NextResponse.json({ error: "Unsupported channel type" }, { status: 400 });
}
