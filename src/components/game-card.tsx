import Link from "next/link";
import type { ScheduleGame } from "@/lib/nhl/schedule";
import { GameStatePill } from "./game-state-pill";
import { TeamLogo } from "./team-logo";

export type GameCardProps = {
  game: ScheduleGame;
  className?: string;
};

export function GameCard({ game, className }: GameCardProps) {
  const { away, home } = sides(game);
  return (
    <Link
      href={`/game/${game.id}`}
      className={`flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-hover)] ${className ?? ""}`}
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
    </Link>
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
  return <span className="px-2 text-sm text-[var(--text-muted)]">@</span>;
}
