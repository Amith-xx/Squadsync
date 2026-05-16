import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import User from "@/lib/db/models/User";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { runTeamBalancing } from "@/lib/utils/runTeamBalancing";
import type { ApiResponse, Position, PlayerAttributes, PusherPlayerJoinedPayload } from "@/types";

// ─── DEV MODE ONLY ────────────────────────────────────────────────────────────
// POST /api/lobbies/[id]/bots — fill remaining slots with seeded bot players.
// Creates temporary User documents (email: bot-*@squadsync.bot) and adds them
// to the lobby with isReady: true. Triggers team balancing when lobby reaches 10.

const BOT_NAMES = [
  "Robo Ronaldo", "Cyber Messi", "Digital Salah", "Matrix Kane",
  "Virtual Haaland", "Synth Mbappé", "Bot Benzema", "AI Modric",
  "Loop De Bruyne", "Pixel Neymar", "Algo Kanté", "Code Kroos",
  "Neural Ramos", "Data Mane", "Script Lewandowski", "Binary Suárez",
  "Func Xavi", "Stack Iniesta", "Queue Piqué", "Hash Vieira",
];

const POSITIONS: Position[] = ["GK", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD", "FWD", "DEF"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAttributes(): PlayerAttributes {
  return {
    pace: randomInt(55, 92),
    shooting: randomInt(55, 92),
    passing: randomInt(55, 92),
    defending: randomInt(55, 92),
    physical: randomInt(55, 92),
  };
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ botsAdded: number }>>> {
  // Guard: DEV only
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: "Invalid lobby ID" }, { status: 400 });
  }

  await connectToDatabase();

  const lobby = await Lobby.findOne({
    _id: new Types.ObjectId(id),
    status: { $in: ["waiting", "ready_check"] },
  }).lean();

  if (!lobby) {
    return NextResponse.json(
      { success: false, error: "Lobby not found or not accepting players" },
      { status: 404 }
    );
  }

  const slotsNeeded = 10 - lobby.players.length;
  if (slotsNeeded <= 0) {
    return NextResponse.json({ success: true, data: { botsAdded: 0 } });
  }

  const channel = PUSHER_CHANNELS.lobby(id);
  const pusher = getPusherServer();
  const timestamp = Date.now();
  let botsAdded = 0;

  // Create bot users and add them to the lobby one at a time to avoid race conditions
  for (let i = 0; i < slotsNeeded; i++) {
    const botName = BOT_NAMES[(lobby.players.length + i) % BOT_NAMES.length] ?? `Bot ${i + 1}`;
    const position = POSITIONS[(lobby.players.length + i) % POSITIONS.length] ?? "MID";
    const karmaScore = randomInt(62, 91);
    const attributes = generateAttributes();

    // Create a temporary bot User document
    const botUser = await User.create({
      name: botName,
      email: `bot-${timestamp}-${i}@squadsync.bot`,
      image: "",
      position,
      attributes,
      karmaScore,
      matchesPlayed: randomInt(5, 40),
      matchesCompleted: randomInt(3, 38),
      noShows: 0,
      isBanned: false,
      banType: null,
      onboardingComplete: true,
      region: lobby.region,
    });

    const botId = botUser._id as Types.ObjectId;

    // Atomically add bot to lobby (guard: still < 10 and accepting players)
    const updated = await Lobby.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        status: { $in: ["waiting", "ready_check"] },
        $expr: { $lt: [{ $size: "$players" }, 10] },
        "players.userId": { $ne: botId },
      },
      {
        $push: {
          players: {
            userId: botId,
            joinedAt: new Date(),
            isReady: true,
            team: null,
          },
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      // Lobby filled before we could add this bot — clean up and stop
      await User.findByIdAndDelete(botId);
      break;
    }

    botsAdded++;

    // Broadcast bot join
    const joinPayload: PusherPlayerJoinedPayload = {
      userId: botId.toString(),
      name: botName,
      image: "",
      karmaScore,
    };

    try {
      await pusher.trigger(channel, PUSHER_EVENTS.PLAYER_JOINED, joinPayload);
      // Also broadcast the bot's ready state
      await pusher.trigger(channel, PUSHER_EVENTS.PLAYER_READY, {
        userId: botId.toString(),
        isReady: true,
      });
    } catch {
      // Non-fatal
    }

    // Transition to ready_check when lobby hits 10 (if still waiting)
    if (updated.players.length === 10 && updated.status === "waiting") {
      await Lobby.updateOne({ _id: id }, { $set: { status: "ready_check" } });
      try {
        await pusher.trigger(channel, PUSHER_EVENTS.LOBBY_STATUS_CHANGED, {
          status: "ready_check",
        });
      } catch {
        // Non-fatal
      }
    }
  }

  // If all 10 slots are now filled and all players are ready → balance teams
  await runTeamBalancing(id);

  return NextResponse.json({ success: true, data: { botsAdded } });
}
