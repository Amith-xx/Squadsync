import { Types } from "mongoose";
import User from "@/lib/db/models/User";
import { getPusherServer } from "@/lib/pusher";
import { PUSHER_EVENTS } from "@/lib/pusher";
import { recalculateKarma, getBanStatus } from "@/lib/utils/karmaEngine";

interface RatingDelta {
  userId: string;
  thumbsUp: boolean;
}

// Applies a single rating's karma delta immediately when a rating is submitted.
// Called from the rate API route — keeps karma live rather than batch-at-end.
export async function applyRatingKarmaDelta(delta: RatingDelta): Promise<void> {
  const user = await User.findById(delta.userId).select("karmaScore").lean();
  if (!user) return;

  const newKarma = recalculateKarma({
    currentKarma: user.karmaScore,
    matchCompleted: false,
    noShow: false,
    positiveRatingsReceived: delta.thumbsUp ? 1 : 0,
    negativeRatingsReceived: delta.thumbsUp ? 0 : 1,
  });

  const { isBanned, banType } = getBanStatus(newKarma);

  await User.updateOne(
    { _id: new Types.ObjectId(delta.userId) },
    { $set: { karmaScore: newKarma, isBanned, banType } }
  );

  // Broadcast so the rated user's UI can update in real time
  try {
    const pusher = getPusherServer();
    await pusher.trigger(
      `private-user-${delta.userId}`,
      PUSHER_EVENTS.KARMA_UPDATED,
      { userId: delta.userId, newKarma }
    );
  } catch {
    // Non-fatal — user's karma is correctly stored in DB
  }
}

// Applies match-completion karma (+3) for every player who confirmed attendance.
// Called from the report route once a match is confirmed.
export async function applyMatchCompletionKarma(
  playerIds: string[]
): Promise<void> {
  for (const uid of playerIds) {
    const user = await User.findById(uid).select("karmaScore matchesPlayed matchesCompleted").lean();
    if (!user) continue;

    const newKarma = recalculateKarma({
      currentKarma: user.karmaScore,
      matchCompleted: true,
      noShow: false,
      positiveRatingsReceived: 0,
      negativeRatingsReceived: 0,
    });

    const { isBanned, banType } = getBanStatus(newKarma);

    await User.updateOne(
      { _id: new Types.ObjectId(uid) },
      {
        $set: { karmaScore: newKarma, isBanned, banType },
        $inc: { matchesCompleted: 1 },
      }
    );
  }
}

// Applies no-show penalty (-15) for players who did NOT confirm attendance.
export async function applyNoShowKarma(playerIds: string[]): Promise<void> {
  for (const uid of playerIds) {
    const user = await User.findById(uid).select("karmaScore noShows").lean();
    if (!user) continue;

    const newKarma = recalculateKarma({
      currentKarma: user.karmaScore,
      matchCompleted: false,
      noShow: true,
      positiveRatingsReceived: 0,
      negativeRatingsReceived: 0,
    });

    const { isBanned, banType } = getBanStatus(newKarma);

    await User.updateOne(
      { _id: new Types.ObjectId(uid) },
      {
        $set: { karmaScore: newKarma, isBanned, banType },
        $inc: { noShows: 1 },
      }
    );
  }
}
