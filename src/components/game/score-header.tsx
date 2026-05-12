"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GameStatePill } from "@/components/game-state-pill";
import { TeamLogo } from "@/components/team-logo";
import type { GameResponse } from "@/lib/nhl/game";
import { useWatching } from "@/lib/watching";

// The game schema is .passthrough(), so summary.scoring rides along on the
// runtime payload but isn't in the typed surface. Mirror just the bits we
// need for the linescore.
type Goal = { teamAbbrev: { default: string } };
type ScoringPeriod = {
  periodDescriptor?: { number?: number; periodType?: string };
  goals?: Goal[];
};
type GameWithSummary = GameResponse & {
  summary?: { scoring?: ScoringPeriod[] };
  regPeriods?: number;
};

type LinePeriod = { number: number; label: string };

function buildPeriods(game: GameWithSummary): LinePeriod[] {
  const regPeriods = game.regPeriods ?? 3;
  const periods: LinePeriod[] = [];
  for (let i = 1; i <= regPeriods; i++) {
    periods.push({ number: i, label: String(i) });
  }
  const extras = new Map<number, string>();
  for (const sp of game.summary?.scoring ?? []) {
    const n = sp.periodDescriptor?.number;
    const t = sp.periodDescriptor?.periodType ?? "OT";
    if (n != null && n > regPeriods) extras.set(n, t);
  }
  const lastNum = game.periodDescriptor?.number ?? 0;
  const lastType = game.periodDescriptor?.periodType ?? "REG";
  if (lastNum > regPeriods && !extras.has(lastNum)) extras.set(lastNum, lastType);
  for (const [num, type] of [...extras.entries()].sort((a, b) => a[0] - b[0])) {
    let label: string;
    if (type === "SO") label = "SO";
    else if (type === "OT") label = num === regPeriods + 1 ? "OT" : `OT${num - regPeriods}`;
    else label = String(num);
    periods.push({ number: num, label });
  }
  return periods;
}

function goalsFor(game: GameWithSummary, teamAbbrev: string, periodNumber: number): number {
  const sp = game.summary?.scoring?.find((s) => s.periodDescriptor?.number === periodNumber);
  return (sp?.goals ?? []).filter((g) => g.teamAbbrev.default === teamAbbrev).length;
}

function isPeriodPlayed(game: GameWithSummary, periodNumber: number): boolean {
  const state = game.gameState;
  if (state === "FUT" || state === "PRE") return false;
  if (state === "FINAL" || state === "OFF") return true;
  return periodNumber <= (game.periodDescriptor?.number ?? 1);
}

export type ScoreHeaderProps = {
  game: GameResponse;
  // Optional: pass `query.dataUpdatedAt` from useGame so we can render a
  // "Updated Xs ago" affordance during live polling.
  updatedAt?: number;
  isFetching?: boolean;
};

export function ScoreHeader({ game, updatedAt, isFetching }: ScoreHeaderProps) {
  const router = useRouter();
  const { clearWatching } = useWatching();

  const handleClose = () => {
    clearWatching();
    router.push("/");
  };

  const g = game as GameWithSummary;
  const periods = buildPeriods(g);
  const isLive = game.gameState === "LIVE" || game.gameState === "CRIT";
  const matchupTitle = `${game.awayTeam.placeName.default} ${game.awayTeam.commonName.default} at ${game.homeTeam.placeName.default} ${game.homeTeam.commonName.default}`;

  return (
    <header
      role="banner"
      className="sticky top-12 z-20 border-b border-(--border) bg-(--surface) px-4 py-3 short:py-1"
      aria-label="Game header"
    >
      {/* Visually-hidden h1 so the page has a heading landmark. */}
      <h1 className="sr-only">{matchupTitle}</h1>

      <div className="mx-auto flex w-full max-w-6xl items-start gap-4 short:gap-2">
        {/* Mobile: stacked team rows. Desktop (md+): full linescore table. */}
        <div className="min-w-0 flex-1">
          <StackedTeams game={game} className="md:hidden" />
          <LinescoreTable game={g} periods={periods} className="hidden md:block" />
        </div>

        <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {isLive ? <FreshnessDot isFetching={isFetching} /> : null}
            <GameStatePill
              state={game.gameState}
              period={game.periodDescriptor?.number}
              clock={game.clock?.timeRemaining}
              startTimeUTC={game.startTimeUTC}
            />
          </div>
          {game.clock?.inIntermission ? (
            <span className="text-xs text-(--text-muted)">Intermission</span>
          ) : null}
          {isLive && updatedAt ? <UpdatedAgo timestamp={updatedAt} /> : null}
        </div>
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

function StackedTeams({ game, className }: { game: GameResponse; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 short:gap-0.5 ${className ?? ""}`}>
      <StackedTeamRow team={game.awayTeam} />
      <StackedTeamRow team={game.homeTeam} />
    </div>
  );
}

function StackedTeamRow({ team }: { team: GameResponse["awayTeam"] }) {
  const fullName = `${team.placeName.default} ${team.commonName.default}`;
  return (
    <div className="flex items-center gap-3 short:gap-2">
      <Link href={`/team/${team.abbrev}`} aria-label={fullName} className="inline-flex shrink-0">
        <span className="block h-12 w-12 short:h-7 short:w-7">
          <TeamLogo code={team.abbrev} size="100%" bare />
        </span>
      </Link>
      <Link href={`/team/${team.abbrev}`} className="min-w-0 flex-1 truncate text-lg short:text-sm font-semibold tracking-tight hover:underline">
        {fullName}
      </Link>
      <span className="text-3xl short:text-lg font-bold tabular-nums">
        {typeof team.score === "number" ? team.score : "—"}
      </span>
    </div>
  );
}

function LinescoreTable({
  game,
  periods,
  className,
}: {
  game: GameWithSummary;
  periods: LinePeriod[];
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className ?? ""}`}>
      <table className="w-auto border-collapse">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-(--text-muted)">
            <th aria-hidden="true" className="w-20"></th>
            <th aria-hidden="true" className="pr-4"></th>
            {periods.map((p) => (
              <th key={p.number} scope="col" className="w-12 px-1 text-center font-medium">
                {p.label}
              </th>
            ))}
            <th
              scope="col"
              className="w-16 px-1 text-center text-sm font-semibold text-(--text)"
            >
              T
            </th>
          </tr>
        </thead>
        <tbody>
          <LinescoreRow team={game.awayTeam} game={game} periods={periods} />
          <LinescoreRow team={game.homeTeam} game={game} periods={periods} />
        </tbody>
      </table>
    </div>
  );
}

function LinescoreRow({
  team,
  game,
  periods,
}: {
  team: GameResponse["awayTeam"];
  game: GameWithSummary;
  periods: LinePeriod[];
}) {
  const fullName = `${team.placeName.default} ${team.commonName.default}`;
  return (
    <tr className="align-middle">
      <td className="py-2 short:py-0.5">
        <Link href={`/team/${team.abbrev}`} aria-label={fullName} className="inline-flex">
          <span className="block h-16 w-16 short:h-8 short:w-8">
            <TeamLogo code={team.abbrev} size="100%" bare />
          </span>
        </Link>
      </td>
      <td className="py-2 pr-4 short:py-0.5">
        <Link
          href={`/team/${team.abbrev}`}
          className="text-2xl short:text-sm font-semibold tracking-tight hover:underline"
        >
          {fullName}
        </Link>
      </td>
      {periods.map((p) => (
        <td
          key={p.number}
          className="px-1 py-2 short:py-0.5 text-center text-2xl short:text-base tabular-nums text-(--text-muted)"
        >
          {isPeriodPlayed(game, p.number) ? goalsFor(game, team.abbrev, p.number) : "—"}
        </td>
      ))}
      <td
        data-testid={`team-total-${team.abbrev}`}
        className="px-1 py-2 short:py-0.5 text-center text-4xl short:text-lg font-bold tabular-nums"
      >
        {typeof team.score === "number" ? team.score : "—"}
      </td>
    </tr>
  );
}

function FreshnessDot({ isFetching }: { isFetching?: boolean }) {
  // Pulses while fetching, solid otherwise. Aria-hidden because the
  // `Updated Xs ago` text below carries the screen-reader signal.
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 rounded-full bg-(--live) ${isFetching ? "animate-pulse" : ""}`}
    />
  );
}

function UpdatedAgo({ timestamp }: { timestamp: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  const label = seconds < 5 ? "just now" : `${seconds}s ago`;
  return (
    <span role="status" aria-live="polite" className="text-[10px] text-(--text-muted)">
      Updated {label}
    </span>
  );
}
