"use client";

import { useRouter } from "next/navigation";
import { GameStatePill } from "@/components/game-state-pill";
import { TeamLogo } from "@/components/team-logo";
import type { GameResponse } from "@/lib/nhl/game";
import { useWatching } from "@/lib/watching";

export function ScoreHeader({ game }: { game: GameResponse }) {
  const router = useRouter();
  const { clearWatching } = useWatching();

  const handleClose = () => {
    clearWatching();
    router.push("/");
  };

  const period = game.periodDescriptor.number;
  const clock = game.clock.timeRemaining;

  return (
    <header
      role="banner"
      className="sticky top-12 z-20 border-b border-(--border) bg-(--surface) px-4 py-4"
      aria-label="Game header"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <TeamColumn
          code={game.awayTeam.abbrev}
          city={game.awayTeam.placeName.default}
          name={game.awayTeam.commonName.default}
          score={game.awayTeam.score}
        />
        <div className="flex flex-col items-center gap-2">
          <GameStatePill
            state={game.gameState}
            period={period}
            clock={clock}
            startTimeUTC={game.startTimeUTC}
          />
          {game.clock.inIntermission ? (
            <span className="text-xs text-(--text-muted)">Intermission</span>
          ) : null}
        </div>
        <TeamColumn
          code={game.homeTeam.abbrev}
          city={game.homeTeam.placeName.default}
          name={game.homeTeam.commonName.default}
          score={game.homeTeam.score}
          align="end"
        />
        <button
          type="button"
          onClick={handleClose}
          aria-label="Stop watching this game"
          className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--border) text-(--text-muted) hover:bg-(--surface-hover)"
        >
          ×
        </button>
      </div>
    </header>
  );
}

function TeamColumn({
  code,
  city,
  name,
  score,
  align = "start",
}: {
  code: string;
  city: string;
  name: string;
  score: number | undefined;
  align?: "start" | "end";
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 ${
        align === "end" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamLogo code={code} size={48} />
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-(--text-muted) truncate">{city}</span>
        <span className="font-semibold tracking-tight truncate">{name}</span>
      </div>
      <span className="ml-auto text-3xl font-bold tabular-nums">
        {typeof score === "number" ? score : "-"}
      </span>
    </div>
  );
}
