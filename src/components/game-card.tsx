"use client";

import Link from "next/link";
import type { ScheduleGame } from "@/lib/nhl/schedule";
import { seriesSummary } from "@/lib/series-status";
import { useWatching } from "@/lib/watching";
import { GameStatePill } from "./game-state-pill";
import { TeamLogo } from "./team-logo";

export type GameCardProps = {
  game: ScheduleGame;
  className?: string;
};

export function GameCard({ game, className }: GameCardProps) {
  const { setWatching } = useWatching();
  const { away, home } = sides(game);

  const handleClick = () => {
    setWatching({
      gameId: game.id,
      away: away.abbrev,
      home: home.abbrev,
      awayScore: away.score ?? 0,
      homeScore: home.score ?? 0,
      state: game.gameState,
    });
  };

  return (
    <Link
      href={`/game/${game.id}`}
      onClick={handleClick}
      className={`flex flex-col gap-3 rounded-lg border border-(--border) bg-(--surface) p-4 transition-colors hover:bg-(--surface-hover) ${className ?? ""}`}
    >
      <div className="flex items-center justify-between">
        <TeamRow code={away.abbrev} score={away.score} />
        <ScoreSep />
        <TeamRow code={home.abbrev} score={home.score} reverse />
      </div>
      <div className="flex items-center justify-center">
        <GameStatePill
          state={game.gameState}
          period={game.periodDescriptor?.number}
          startTimeUTC={game.startTimeUTC}
        />
      </div>
      <SeriesBadge game={game} />
    </Link>
  );
}

function SeriesBadge({ game }: { game: ScheduleGame }) {
  const s = game.seriesStatus;
  // Only playoff games carry a series; bail otherwise. `topSeedWins` is the
  // signal the block is populated (pre-series schedule rows can omit it).
  if (!s || s.topSeedWins == null || s.bottomSeedWins == null) return null;
  if (!s.topSeedTeamAbbrev || !s.bottomSeedTeamAbbrev) return null;

  const summary = seriesSummary(
    { abbrev: s.topSeedTeamAbbrev, wins: s.topSeedWins },
    { abbrev: s.bottomSeedTeamAbbrev, wins: s.bottomSeedWins },
    s.neededToWin ?? 4,
  );
  const prefix = s.seriesAbbrev ? `${s.seriesAbbrev} · ` : "";

  return (
    <p className="text-center text-xs text-(--text-muted)">
      {prefix}
      {summary.text}
    </p>
  );
}

function sides(game: ScheduleGame) {
  return {
    away: { abbrev: game.awayTeam.abbrev, score: game.awayTeam.score },
    home: { abbrev: game.homeTeam.abbrev, score: game.homeTeam.score },
  };
}

function TeamRow({
  code,
  score,
  reverse = false,
}: {
  code: string;
  score: number | undefined;
  reverse?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-3 ${reverse ? "flex-row-reverse" : ""}`}
    >
      <TeamLogo code={code} size={36} />
      <div className={`flex flex-col ${reverse ? "items-end" : ""}`}>
        <span className="text-base font-semibold tracking-tight">{code}</span>
        {typeof score === "number" ? (
          <span className="text-2xl font-bold tabular-nums">{score}</span>
        ) : null}
      </div>
    </div>
  );
}

function ScoreSep() {
  return <span className="px-2 text-sm text-(--text-muted)">@</span>;
}
