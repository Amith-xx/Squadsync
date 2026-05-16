import { Types } from "mongoose";
import Lobby from "@/lib/db/models/Lobby";
import User from "@/lib/db/models/User";
import { balanceTeams } from "@/lib/utils/teamBalancer";
import { getPusherServer, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher";
import type {
  PlayerAttributes,
  PlayerWithAttributes,
  PusherTeamsFormedPayload,
} from "@/types";

// Runs team balancing for a lobby that has exactly 10 ready players.
// Returns true if THIS call performed the balancing (atomic guard prevents double-trigger).
// Returns false if the lobby is not in the right state, or another request already ran it.
export async function runTeamBalancing(lobbyId: string): Promise<boolean> {
  const lobby = await Lobby.findById(lobbyId).lean();
  if (!lobby) return false;
  if (lobby.players.length !== 10) return false;
  if (!lobby.players.every((p) => p.isReady)) return false;
  if (!["waiting", "ready_check"].includes(lobby.status)) return false;

  // Fetch all 10 user attribute records
  const playerIds = lobby.players.map((p) => p.userId);
  const users = await User.find({ _id: { $in: playerIds } })
    .select("karmaScore attributes")
    .lean();

  if (users.length !== 10) return false;

  const playersForBalancing: PlayerWithAttributes[] = users.map((u) => ({
    userId: u._id.toString(),
    attributes: u.attributes as PlayerAttributes,
    karmaScore: u.karmaScore,
  }));

  const { teamA, teamB } = balanceTeams(playersForBalancing);

  // balanceTeams guarantees 5 players per team given 10 inputs, but guard for TS
  if (teamA.length !== 5 || teamB.length !== 5) return false;

  // Captain = highest karma player in each team
  const captainA = teamA.reduce<string>((bestId, uid) => {
    const u = users.find((x) => x._id.toString() === uid);
    const best = users.find((x) => x._id.toString() === bestId);
    return u && best && u.karmaScore > best.karmaScore ? uid : bestId;
  }, teamA[0] as string);

  const captainB = teamB.reduce<string>((bestId, uid) => {
    const u = users.find((x) => x._id.toString() === uid);
    const best = users.find((x) => x._id.toString() === bestId);
    return u && best && u.karmaScore > best.karmaScore ? uid : bestId;
  }, teamB[0] as string);

  const teamAIds = teamA.map((id) => new Types.ObjectId(id));
  const teamBIds = teamB.map((id) => new Types.ObjectId(id));

  // Build a per-player team map for the positional updates inside players[]
  const teamMap: Record<string, "A" | "B"> = {};
  teamA.forEach((id) => { teamMap[id] = "A"; });
  teamB.forEach((id) => { teamMap[id] = "B"; });

  // Atomic transition using an aggregation pipeline update.
  // The filter ensures only one concurrent request wins (status guard).
  // The pipeline atomically sets status, team arrays, captains, player team
  // assignments, and removes the TTL expiresAt field in one operation.
  const transitioned = await Lobby.findOneAndUpdate(
    {
      _id: new Types.ObjectId(lobbyId),
      status: { $in: ["waiting", "ready_check"] },
    },
    [
      {
        $set: {
          status: "voting",
          teamA: teamAIds,
          teamB: teamBIds,
          captainA: new Types.ObjectId(captainA),
          captainB: new Types.ObjectId(captainB),
          // Assign team field on every player slot
          players: {
            $map: {
              input: "$players",
              as: "p",
              in: {
                $mergeObjects: [
                  "$$p",
                  {
                    team: {
                      $cond: [
                        { $in: ["$$p.userId", teamAIds] },
                        "A",
                        { $cond: [{ $in: ["$$p.userId", teamBIds] }, "B", null] },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $unset: "expiresAt" },
    ],
    { new: false }
  ).lean();

  if (!transitioned) return false; // Another request won the race

  // Broadcast to all connected lobby clients
  const channel = PUSHER_CHANNELS.lobby(lobbyId);
  const teamsPayload: PusherTeamsFormedPayload = { teamA, teamB, captainA, captainB };

  try {
    await getPusherServer().trigger(channel, PUSHER_EVENTS.TEAMS_FORMED, teamsPayload);
    await getPusherServer().trigger(channel, PUSHER_EVENTS.LOBBY_STATUS_CHANGED, {
      status: "voting",
    });
  } catch {
    // Pusher failure is non-fatal — DB state is correct; clients recover on refresh
  }

  return true;
}
