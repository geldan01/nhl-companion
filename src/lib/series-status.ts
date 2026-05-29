// Shared best-of-7 series math, used by the playoff bracket, the scoreboard
// card badge, and the game-detail series banner. Pure and framework-free so it
// can be unit-tested directly.

export type SeriesSide = { abbrev: string; wins: number };

export type SeriesSummary = {
  // Human-readable status, e.g. "CAR wins 4–1", "MTL leads 3–2",
  // "Series tied 2–2", "Series not started".
  text: string;
  // The abbrev of the team ahead (or the winner). null when tied.
  leaderAbbrev: string | null;
  // True once a team has reached `neededToWin`.
  decided: boolean;
};

const EN_DASH = '–';

export function seriesSummary(
  a: SeriesSide,
  b: SeriesSide,
  neededToWin: number = 4,
): SeriesSummary {
  const hi = Math.max(a.wins, b.wins);
  const lo = Math.min(a.wins, b.wins);
  const leader = a.wins === b.wins ? null : a.wins > b.wins ? a : b;
  const decided = a.wins >= neededToWin || b.wins >= neededToWin;
  const score = `${hi}${EN_DASH}${lo}`;

  if (decided && leader) {
    return { text: `${leader.abbrev} wins ${score}`, leaderAbbrev: leader.abbrev, decided: true };
  }
  if (!leader) {
    const text = hi === 0 ? 'Series not started' : `Series tied ${score}`;
    return { text, leaderAbbrev: null, decided: false };
  }
  return { text: `${leader.abbrev} leads ${score}`, leaderAbbrev: leader.abbrev, decided: false };
}
