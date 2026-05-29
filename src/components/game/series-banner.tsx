"use client";

import type { GameResponse } from "@/lib/nhl/game";
import { useRightRail } from "@/lib/nhl/rightRail";
import { seriesSummary } from "@/lib/series-status";

const PLAYOFF_GAME_TYPE = 3;

// A slim banner under the score header showing where the playoff series stands
// — before, during, and after the game. Renders nothing for regular-season
// games or until the series data lands, so it's safe to mount unconditionally.
export function SeriesBanner({ game }: { game: GameResponse }) {
  const isPlayoff = game.gameType === PLAYOFF_GAME_TYPE;
  // Hooks must run unconditionally; the query is cheap and gated by gameState
  // for polling. We simply don't render when it's not a playoff game.
  const { data } = useRightRail(game.id, game.gameState);

  if (!isPlayoff) return null;

  const wins = data?.seasonSeriesWins;
  if (!wins) return null;

  const summary = seriesSummary(
    { abbrev: game.awayTeam.abbrev, wins: wins.awayTeamWins },
    { abbrev: game.homeTeam.abbrev, wins: wins.homeTeamWins },
    wins.neededToWin ?? 4,
  );

  return (
    <div className="border-b border-(--border) bg-(--surface) px-4 py-1.5 text-center text-xs font-medium text-(--text-muted)">
      {summary.text}
    </div>
  );
}
