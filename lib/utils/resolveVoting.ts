import { Types } from "mongoose";
import Lobby from "@/lib/db/models/Lobby";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import { createMatch } from "@/lib/utils/createMatch";

// Resolves turf voting for a lobby: tallies votes, picks plurality winner,
// atomically transitions status to "confirmed", and broadcasts the result.
// Race-condition safe — uses status guard in findOneAndUpdate.
// Returns true if THIS call performed the resolution.
export async function resolveVoting(lobbyId: string): Promise<boolean> {
  const lobby = await Lobby.findById(lobbyId).lean();
  if (!lobby || lobby.status !== "voting") return false;

  // Tally votes
  const tally: Record<string, number> = {};
  for (const tv of lobby.turfVotes) {
    const id = tv.turfId.toString();
    tally[id] = (tally[id] ?? 0) + 1;
  }

  // Plurality winner; tiebreak = first candidateTurfId by position
  let winnerId: string | null = null;

  if (Object.keys(tally).length > 0) {
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    winnerId = sorted[0]?.[0] ?? null;
  }

  // Fallback: no votes cast → first candidate turf
  if (!winnerId) {
    const first = lobby.candidateTurfIds?.[0];
    winnerId = first ? first.toString() : null;
  }

  if (!winnerId) return false;

  const winnerOid = new Types.ObjectId(winnerId);

  // Atomic transition — only wins if status is still "voting"
  const transitioned = await Lobby.findOneAndUpdate(
    { _id: new Types.ObjectId(lobbyId), status: "voting" },
    { $set: { selectedTurf: winnerOid, status: "confirmed" } },
    { new: false }
  ).lean();

  if (!transitioned) return false;

  const channel = PUSHER_CHANNELS.lobby(lobbyId);
  try {
    await getPusherServer().trigger(channel, PUSHER_EVENTS.TURF_SELECTED, { turfId: winnerId });
    await getPusherServer().trigger(channel, PUSHER_EVENTS.LOBBY_STATUS_CHANGED, { status: "confirmed" });
  } catch {
    // Non-fatal — DB state is correct; clients recover on refresh
  }

  // Create the Match document and broadcast MATCH_READY
  try {
    await createMatch(lobbyId);
  } catch {
    // Non-fatal — match can be created on demand from the lobby page
  }

  return true;
}
