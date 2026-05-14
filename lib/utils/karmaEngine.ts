import type { KarmaUpdateInput, BanType } from "@/types";

// Placeholder — full Karma recalculation logic goes here on Day 5.
// Formula from PRD §14:
//   newKarma = clamp(
//     currentKarma
//     + (matchCompleted ? +3 : 0)
//     + (noShow ? -15 : 0)
//     + (positiveRatingsReceived × 1)
//     - (negativeRatingsReceived × 2),
//     0, 100
//   )
//
// Threshold effects:
//   71–100 → Trusted    (priority matchmaking)
//   41–70  → Standard   (normal queue)
//   21–40  → Shadow Ban (ranked last, warning shown only to self)
//   0–20   → Hard Ban   (blocked from all matchmaking)

export function recalculateKarma(input: KarmaUpdateInput): number {
  const {
    currentKarma,
    matchCompleted,
    noShow,
    positiveRatingsReceived,
    negativeRatingsReceived,
  } = input;

  const delta =
    (matchCompleted ? 3 : 0) +
    (noShow ? -15 : 0) +
    positiveRatingsReceived * 1 -
    negativeRatingsReceived * 2;

  return Math.min(100, Math.max(0, currentKarma + delta));
}

export function getBanStatus(karmaScore: number): {
  isBanned: boolean;
  banType: BanType;
} {
  if (karmaScore <= 20) {
    return { isBanned: true, banType: "hard" };
  }
  if (karmaScore <= 40) {
    return { isBanned: true, banType: "shadow" };
  }
  return { isBanned: false, banType: null };
}

export type KarmaStatus = "trusted" | "standard" | "shadow" | "hard";

export function getKarmaStatus(karmaScore: number): KarmaStatus {
  if (karmaScore >= 71) return "trusted";
  if (karmaScore >= 41) return "standard";
  if (karmaScore >= 21) return "shadow";
  return "hard";
}
