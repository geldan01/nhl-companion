"use client";

import Link from "next/link";
import { useGame } from "@/lib/nhl/game";
import { useWatching, type WatchingSnapshot } from "@/lib/watching";
import { GameStatePill } from "./game-state-pill";

export function NowWatchingPill() {
  const { watching } = useWatching();
  if (!watching) return null;
  // Splitting into ActivePill keeps the useGame subscription conditional at
  // the component level (no hook is called when nothing is being watched)
  // while still obeying the rules of hooks inside ActivePill.
  return <ActivePill watching={watching} />;
}

function ActivePill({ watching }: { watching: WatchingSnapshot }) {
  // Subscribes to the same React Query cache key as /game/[id], so the pill's
  // displayed score updates in lock-step with the page underneath without a
  // duplicate poll. When game.data is missing (e.g., navigated cold), fall
  // back to the snapshot the scoreboard or game-page mount effect seeded.
  const game = useGame(watching.gameId);
  const live = game.data;

  const away = live?.awayTeam.abbrev ?? watching.away;
  const home = live?.homeTeam.abbrev ?? watching.home;
  const awayScore = live?.awayTeam.score ?? watching.awayScore;
  const homeScore = live?.homeTeam.score ?? watching.homeScore;
  const state = live?.gameState ?? watching.state;
  const period = live?.periodDescriptor?.number;
  const clock = live?.clock?.timeRemaining;

  return (
    <Link
      href={`/game/${watching.gameId}`}
      className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-3 py-1 text-xs hover:bg-(--surface-hover)"
    >
      <span className="font-semibold">{away}</span>
      <span className="tabular-nums">{awayScore}</span>
      <span className="text-(--text-muted)">–</span>
      <span className="tabular-nums">{homeScore}</span>
      <span className="font-semibold">{home}</span>
      <GameStatePill state={state} period={period} clock={clock} />
    </Link>
  );
}
