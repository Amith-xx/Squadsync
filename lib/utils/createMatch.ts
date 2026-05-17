import { Types } from "mongoose";
import Match from "@/lib/db/models/Match";
import Lobby from "@/lib/db/models/Lobby";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import type { PusherMatchReadyPayload } from "@/types";

// Creates a Match document from a confirmed lobby and broadcasts MATCH_READY.
// Idempotent — if a match for this lobby already exists, returns its ID.
// Race-safe: uses findOne before create; concurrent calls may both create,
// but the caller should guard upstream (resolveVoting already has a status guard).
export async function createMatch(lobbyId: string): Promise<string | null> {
  const lobby = await Lobby.findById(lobbyId).lean();
  if (!lobby) return null;
  if (!lobby.captainA || !lobby.captainB) return null;

  // Idempotency: return existing match if one exists for this lobby
  const existing = await Match.findOne({ lobbyId: new Types.ObjectId(lobbyId) })
    .select("_id")
    .lean();
  if (existing) return existing._id.toString();

  const match = await Match.create({
    lobbyId: new Types.ObjectId(lobbyId),
    turfId: lobby.selectedTurf ?? null,
    teamA: lobby.teamA,
    teamB: lobby.teamB,
    captainA: lobby.captainA,
    captainB: lobby.captainB,
    status: "pending_reports",
  });

  const matchId = (match._id as Types.ObjectId).toString();

  // Transition lobby to "active"
  await Lobby.updateOne(
    { _id: new Types.ObjectId(lobbyId), status: "confirmed" },
    { $set: { status: "active" }, $unset: { expiresAt: 1 } }
  );

  // Broadcast to lobby channel so all clients can navigate
  const channel = PUSHER_CHANNELS.lobby(lobbyId);
  try {
    const payload: PusherMatchReadyPayload = { matchId };
    await getPusherServer().trigger(channel, PUSHER_EVENTS.MATCH_READY, payload);
    await getPusherServer().trigger(channel, PUSHER_EVENTS.LOBBY_STATUS_CHANGED, { status: "active" });
  } catch {
    // Non-fatal — DB state is correct; clients recover on refresh
  }

  return matchId;
}
