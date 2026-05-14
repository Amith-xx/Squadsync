import type { PlayerWithAttributes, BalancedTeams } from "@/types";

// Placeholder — full Snake Draft implementation goes here on Day 3.
// Formula from PRD §13:
//   powerScore = (pace×0.2 + shooting×0.2 + passing×0.2 + defending×0.2 + physical×0.2)
//                × (0.7 + karmaScore/100 × 0.3)
//
// Snake pick order: A B B A A B B A A B
// Verify: |avgPowerA − avgPowerB| < 10%

export function computePowerScore(
  attributes: PlayerWithAttributes["attributes"],
  karmaScore: number
): number {
  const attributeAvg =
    (attributes.pace +
      attributes.shooting +
      attributes.passing +
      attributes.defending +
      attributes.physical) *
    0.2;

  const karmaMultiplier = 0.7 + (karmaScore / 100) * 0.3;

  return attributeAvg * karmaMultiplier;
}

export function balanceTeams(players: PlayerWithAttributes[]): BalancedTeams {
  if (players.length !== 10) {
    throw new Error("balanceTeams requires exactly 10 players");
  }

  const ranked = [...players].sort(
    (a, b) =>
      computePowerScore(b.attributes, b.karmaScore) -
      computePowerScore(a.attributes, a.karmaScore)
  );

  // Snake draft pick order: picks[i] is 'A' or 'B'
  const snakePicks: Array<"A" | "B"> = ["A", "B", "B", "A", "A", "B", "B", "A", "A", "B"];

  const teamA: string[] = [];
  const teamB: string[] = [];

  ranked.forEach((player, i) => {
    const pick = snakePicks[i];
    if (pick === "A") {
      teamA.push(player.userId);
    } else {
      teamB.push(player.userId);
    }
  });

  const teamAPower = teamA.reduce((sum, id) => {
    const p = ranked.find((r) => r.userId === id);
    return sum + (p ? computePowerScore(p.attributes, p.karmaScore) : 0);
  }, 0);

  const teamBPower = teamB.reduce((sum, id) => {
    const p = ranked.find((r) => r.userId === id);
    return sum + (p ? computePowerScore(p.attributes, p.karmaScore) : 0);
  }, 0);

  return {
    teamA,
    teamB,
    teamAPowerAvg: teamAPower / 5,
    teamBPowerAvg: teamBPower / 5,
  };
}
