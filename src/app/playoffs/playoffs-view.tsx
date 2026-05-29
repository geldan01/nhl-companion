"use client";

import Link from "next/link";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { TeamLogo } from "@/components/team-logo";
import {
  isTbdTeam,
  usePlayoffBracket,
  type PlayoffSeries,
  type PlayoffSeriesTeam,
} from "@/lib/nhl/playoffBracket";
import { seriesSummary } from "@/lib/series-status";

// Round number → short column heading. Falls back to the series' own title for
// anything unexpected (the NHL has used play-in rounds in odd seasons).
const ROUND_LABELS: Record<number, string> = {
  1: "First Round",
  2: "Second Round",
  3: "Conference Finals",
  4: "Stanley Cup Final",
};

export function PlayoffsView() {
  const query = usePlayoffBracket();
  const data = query.data;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Playoffs</h1>
      </header>
      <DataState
        isLoading={query.isLoading}
        error={query.error ?? null}
        hasData={Boolean(data)}
        skeleton={<Skeleton variant="card" count={4} />}
        emptyState={
          <p className="px-4 py-12 text-center text-sm text-(--text-muted)">
            No playoff bracket available yet.
          </p>
        }
      >
        {data ? <Bracket series={data.series} /> : null}
      </DataState>
    </div>
  );
}

function Bracket({ series }: { series: PlayoffSeries[] }) {
  const rounds = [...new Set(series.map((s) => s.playoffRound))].sort((a, b) => a - b);

  return (
    // Horizontal funnel on wide screens, stacked sections on mobile.
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-6 lg:overflow-x-auto lg:pb-2">
      {rounds.map((round) => {
        const inRound = series
          .filter((s) => s.playoffRound === round)
          .sort((a, b) => a.seriesLetter.localeCompare(b.seriesLetter));
        const label = ROUND_LABELS[round] ?? inRound[0]?.seriesTitle ?? `Round ${round}`;
        return (
          <section
            key={round}
            className="flex min-w-0 flex-col gap-3 lg:min-w-[260px] lg:flex-1 lg:justify-around"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              {label}
            </h2>
            <div className="flex flex-col gap-3 lg:gap-6">
              {inRound.map((s) => (
                <SeriesCard key={s.seriesLetter} series={s} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SeriesCard({ series }: { series: PlayoffSeries }) {
  const { topSeedTeam, bottomSeedTeam, topSeedWins, bottomSeedWins } = series;
  const summary = seriesSummary(
    { abbrev: topSeedTeam.abbrev, wins: topSeedWins },
    { abbrev: bottomSeedTeam.abbrev, wins: bottomSeedWins },
    series.neededToWin ?? 4,
  );
  const decided = series.winningTeamId != null;

  const card = (
    <div className="overflow-hidden rounded-lg border border-(--border) bg-(--surface) transition-colors hover:bg-(--surface-hover)">
      <SeriesTeamRow
        team={topSeedTeam}
        seed={series.topSeedRankAbbrev}
        wins={topSeedWins}
        eliminated={decided && series.losingTeamId === topSeedTeam.id}
      />
      <div className="border-t border-(--border)" />
      <SeriesTeamRow
        team={bottomSeedTeam}
        seed={series.bottomSeedRankAbbrev}
        wins={bottomSeedWins}
        eliminated={decided && series.losingTeamId === bottomSeedTeam.id}
      />
      <p className="border-t border-(--border) px-3 py-1.5 text-center text-xs text-(--text-muted)">
        {summary.text}
      </p>
    </div>
  );

  // Link through to the series' game list when the NHL provides a path and the
  // matchup is set (TBD slots have nowhere to go).
  if (series.seriesUrl && !isTbdTeam(topSeedTeam) && !isTbdTeam(bottomSeedTeam)) {
    return (
      <Link
        href={`https://www.nhl.com${series.seriesUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${series.seriesTitle}: ${summary.text}`}
        className="block"
      >
        {card}
      </Link>
    );
  }
  return card;
}

function SeriesTeamRow({
  team,
  seed,
  wins,
  eliminated,
}: {
  team: PlayoffSeriesTeam;
  seed?: string;
  wins: number;
  eliminated: boolean;
}) {
  const tbd = isTbdTeam(team);
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 ${
        eliminated ? "opacity-50" : ""
      }`}
    >
      {tbd ? (
        <span
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-dashed border-(--border) text-[10px] text-(--text-muted)"
          aria-hidden
        >
          ?
        </span>
      ) : (
        <TeamLogo code={team.abbrev} size={24} />
      )}
      {seed ? (
        <span className="w-7 shrink-0 text-[10px] font-medium tabular-nums text-(--text-muted)">
          {seed}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {tbd ? "TBD" : team.abbrev}
      </span>
      <span className="text-base font-bold tabular-nums">{wins}</span>
    </div>
  );
}
