// Pure derivations for the team KPI dashboard. Kept separate from the React
// component so the win/loss + home/away math can be unit-tested without a DOM.
import type { TeamScheduleGame } from "@/lib/nhl/teamSchedule";
import type { TeamSkater } from "@/lib/nhl/team";

export type Outcome = "W" | "L" | "OTL";

export type GoalsTrendGame = {
  id: number;
  opp: string;
  isHome: boolean;
  gf: number;
  ga: number;
  outcome: Outcome;
  date: string;
};

export type Split = {
  gp: number;
  wins: number;
  losses: number;
  otLosses: number;
  gf: number;
  ga: number;
};

export type ScorerRow = {
  id: number;
  name: string;
  goals: number;
  assists: number;
  points: number;
};

// Completed regular-season (2) or playoff (3) game with both scores present.
// Preseason and not-yet-final games are excluded from every KPI.
export function isCompleted(g: TeamScheduleGame): boolean {
  return (
    (g.gameType === 2 || g.gameType === 3) &&
    (g.gameState === "FINAL" || g.gameState === "OFF") &&
    typeof g.homeTeam.score === "number" &&
    typeof g.awayTeam.score === "number"
  );
}

// Goals for/against and outcome from `code`'s perspective. A regulation/OT/SO
// loss is distinguished via the game's `lastPeriodType` so OTLs aren't lumped
// in with regulation losses. Returns null when scores are missing.
export function resultFor(
  code: string,
  g: TeamScheduleGame,
): { gf: number; ga: number; outcome: Outcome } | null {
  const isHome = g.homeTeam.abbrev === code;
  const gf = isHome ? g.homeTeam.score : g.awayTeam.score;
  const ga = isHome ? g.awayTeam.score : g.homeTeam.score;
  if (typeof gf !== "number" || typeof ga !== "number") return null;
  const ot =
    g.gameOutcome?.lastPeriodType === "OT" || g.gameOutcome?.lastPeriodType === "SO";
  const outcome: Outcome = gf > ga ? "W" : ot ? "OTL" : "L";
  return { gf, ga, outcome };
}

// The most recent `limit` completed games, oldest → newest, for the diverging
// goals trend chart.
export function trendGames(
  code: string,
  games: TeamScheduleGame[],
  limit: number,
): GoalsTrendGame[] {
  return games
    .filter(isCompleted)
    .sort((a, b) => a.gameDate.localeCompare(b.gameDate))
    .slice(-limit)
    .map((g) => {
      const r = resultFor(code, g)!;
      const isHome = g.homeTeam.abbrev === code;
      return {
        id: g.id,
        opp: (isHome ? g.awayTeam : g.homeTeam).abbrev,
        isHome,
        gf: r.gf,
        ga: r.ga,
        outcome: r.outcome,
        date: g.gameDate,
      };
    });
}

// Aggregate record + goals for home games (`home: true`) or away games.
export function splitFor(
  code: string,
  games: TeamScheduleGame[],
  home: boolean,
): Split {
  const split: Split = { gp: 0, wins: 0, losses: 0, otLosses: 0, gf: 0, ga: 0 };
  for (const g of games) {
    if (!isCompleted(g)) continue;
    if ((g.homeTeam.abbrev === code) !== home) continue;
    const r = resultFor(code, g);
    if (!r) continue;
    split.gp += 1;
    split.gf += r.gf;
    split.ga += r.ga;
    if (r.outcome === "W") split.wins += 1;
    else if (r.outcome === "OTL") split.otLosses += 1;
    else split.losses += 1;
  }
  return split;
}

// Top `limit` skaters by points, descending.
export function topScorers(skaters: TeamSkater[], limit: number): ScorerRow[] {
  return [...skaters]
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    .slice(0, limit)
    .map((s) => ({
      id: s.playerId,
      name: `${s.firstName.default} ${s.lastName.default}`,
      goals: s.goals ?? 0,
      assists: s.assists ?? 0,
      points: s.points ?? 0,
    }));
}
