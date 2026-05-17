import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import Lobby from "@/lib/db/models/Lobby";
import User from "@/lib/db/models/User";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { runTeamBalancing } from "@/lib/utils/runTeamBalancing";
import { resolveVoting } from "@/lib/utils/resolveVoting";
import type {
  ApiResponse,
  Position,
  OutfieldAttributes,
  GKAttributes,
  PusherPlayerJoinedPayload,
  PusherChatMessagePayload,
} from "@/types";
import { randomUUID } from "crypto";

// ─── DEV MODE ONLY ────────────────────────────────────────────────────────────

const BOT_NAMES = [
  "Robo Ronaldo", "Cyber Messi", "Digital Salah", "Matrix Kane",
  "Virtual Haaland", "Synth Mbappé", "Bot Benzema", "AI Modric",
  "Loop De Bruyne", "Pixel Neymar", "Algo Kanté", "Code Kroos",
  "Neural Ramos", "Data Mane", "Script Lewandowski", "Binary Suárez",
  "Func Xavi", "Stack Iniesta", "Queue Piqué", "Hash Vieira",
];

const BOT_CHAT_LINES = [
  "GG everyone 🤝", "Let's get this W!", "Who's playing up front?",
  "Decent lobby tbh", "Anyone on comms?", "Let's go boys!",
  "Ready to run the pitch 🏃", "Solid team balance ngl",
  "First touch let's gooo", "Clean game please",
];

const POSITIONS: Position[] = ["GK", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD", "FWD", "DEF"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAttributes(position: Position): OutfieldAttributes | GKAttributes {
  if (position === "GK") {
    return {
      diving:   randomInt(55, 92),
      reflex:   randomInt(55, 92),
      speed:    randomInt(55, 92),
      handling: randomInt(55, 92),
      physical: randomInt(55, 92),
    };
  }
  return {
    pace:      randomInt(55, 92),
    shooting:  randomInt(55, 92),
    passing:   randomInt(55, 92),
    defending: randomInt(55, 92),
    physical:  randomInt(55, 92),
  };
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ botsAdded: number }>>> {
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
  const botIds: string[] = [];

  for (let i = 0; i < slotsNeeded; i++) {
    const botName = BOT_NAMES[(lobby.players.length + i) % BOT_NAMES.length] ?? `Bot ${i + 1}`;
    const position = POSITIONS[(lobby.players.length + i) % POSITIONS.length] ?? "MID";
    const karmaScore = randomInt(62, 91);
    const attributes = generateAttributes(position);

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

    const updated = await Lobby.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        status: { $in: ["waiting", "ready_check"] },
        $expr: { $lt: [{ $size: "$players" }, 10] },
        "players.userId": { $ne: botId },
      },
      {
        $push: {
          players: { userId: botId, joinedAt: new Date(), isReady: true, team: null },
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      await User.findByIdAndDelete(botId);
      break;
    }

    botsAdded++;
    botIds.push(botId.toString());

    const joinPayload: PusherPlayerJoinedPayload = {
      userId: botId.toString(),
      name: botName,
      image: "",
      karmaScore,
    };

    try {
      await pusher.trigger(channel, PUSHER_EVENTS.PLAYER_JOINED, joinPayload);
      await pusher.trigger(channel, PUSHER_EVENTS.PLAYER_READY, {
        userId: botId.toString(),
        isReady: true,
      });
    } catch { /* Non-fatal */ }

    if (updated.players.length === 10 && updated.status === "waiting") {
      await Lobby.updateOne({ _id: id }, { $set: { status: "ready_check" } });
      try {
        await pusher.trigger(channel, PUSHER_EVENTS.LOBBY_STATUS_CHANGED, { status: "ready_check" });
      } catch { /* Non-fatal */ }
    }
  }

  // Trigger team balancing if all 10 ready
  const balanced = await runTeamBalancing(id);

  // ── DEV: auto-vote for random candidate turfs after balancing ────────────
  if (balanced) {
    // Small delay to let the status transition settle
    await new Promise((r) => setTimeout(r, 300));

    const votingLobby = await Lobby.findById(id).lean();
    if (votingLobby?.status === "voting" && votingLobby.candidateTurfIds?.length > 0) {
      const candidates = votingLobby.candidateTurfIds;

      // Each bot player casts a vote for a random candidate turf
      for (const player of votingLobby.players) {
        const alreadyVoted = votingLobby.turfVotes.some(
          (v) => v.userId.toString() === player.userId.toString()
        );
        if (alreadyVoted) continue;

        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        if (!pick) continue;

        await Lobby.updateOne(
          { _id: votingLobby._id },
          { $push: { turfVotes: { userId: player.userId, turfId: pick } } }
        );
      }

      // Re-tally and broadcast
      const afterVotes = await Lobby.findById(id).lean();
      if (afterVotes) {
        const voteCounts: Record<string, number> = {};
        for (const tv of afterVotes.turfVotes) {
          const tid = tv.turfId.toString();
          voteCounts[tid] = (voteCounts[tid] ?? 0) + 1;
        }
        try {
          await pusher.trigger(channel, PUSHER_EVENTS.VOTE_CAST, {
            userId: "bots",
            turfId: "",
            voteCounts,
          });
        } catch { /* Non-fatal */ }

        // Resolve voting now that all bots have voted
        await resolveVoting(id);
      }

      // ── Fake chat messages from 2 random bots ─────────────────────────
      const chatBots = botIds.slice(0, 2);
      for (const botId of chatBots) {
        const botUser = await User.findById(botId).select("name").lean();
        if (!botUser) continue;
        const line = BOT_CHAT_LINES[Math.floor(Math.random() * BOT_CHAT_LINES.length)] ?? "GG";
        const chatPayload: PusherChatMessagePayload = {
          messageId: randomUUID(),
          userId: botId,
          name: botUser.name,
          image: "",
          message: line,
          sentAt: new Date().toISOString(),
        };
        try {
          await pusher.trigger(channel, PUSHER_EVENTS.CHAT_MESSAGE, chatPayload);
        } catch { /* Non-fatal */ }
        // Stagger messages slightly
        await new Promise((r) => setTimeout(r, 150));
      }
    }
  }

  return NextResponse.json({ success: true, data: { botsAdded } });
}
