"use client";

import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import {
  isTbdTeam,
  type PlayoffSeries,
  type PlayoffSeriesTeam,
} from "@/lib/nhl/playoffBracket";
import { seriesSummary } from "@/lib/series-status";

const ROUND_LABELS: Record<number, string> = {
  1: "First Round",
  2: "Second Round",
  3: "Conference Finals",
  4: "Stanley Cup Final",
};

// Compact playoff bracket for the homepage. Unlike the full /playoffs view,
// each (set) team links through to its team page, per the homepage spec.
export function HomeBracket({ series }: { series: PlayoffSeries[] }) {
  const rounds = [...new Set(series.map((s) => s.playoffRound))].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-4 lg:overflow-x-auto lg:pb-2">
      {rounds.map((round) => {
        const inRound = series
          .filter((s) => s.playoffRound === round)
          .sort((a, b) => a.seriesLetter.localeCompare(b.seriesLetter));
        const label = ROUND_LABELS[round] ?? inRound[0]?.seriesTitle ?? `Round ${round}`;
        return (
          <section
            key={round}
            className="flex min-w-0 flex-col gap-2.5 lg:min-w-[220px] lg:flex-1 lg:justify-around"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              {label}
            </h3>
            <div className="flex flex-col gap-2.5 lg:gap-5">
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

  return (
    <div className="overflow-hidden rounded-lg border border-(--border) bg-(--surface)">
      <SeriesTeamRow
        team={topSeedTeam}
        wins={topSeedWins}
        eliminated={decided && series.losingTeamId === topSeedTeam.id}
      />
      <div className="border-t border-(--border)" />
      <SeriesTeamRow
        team={bottomSeedTeam}
        wins={bottomSeedWins}
        eliminated={decided && series.losingTeamId === bottomSeedTeam.id}
      />
      <p className="border-t border-(--border) px-3 py-1.5 text-center text-xs text-(--text-muted)">
        {summary.text}
      </p>
    </div>
  );
}

function SeriesTeamRow({
  team,
  wins,
  eliminated,
}: {
  team: PlayoffSeriesTeam;
  wins: number;
  eliminated: boolean;
}) {
  const tbd = isTbdTeam(team);
  const inner = (
    <div className={`flex items-center gap-2.5 px-3 py-2 ${eliminated ? "opacity-50" : ""}`}>
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
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {tbd ? "TBD" : team.abbrev}
      </span>
      <span className="text-base font-bold tabular-nums">{wins}</span>
    </div>
  );

  // Set teams link to their team page; TBD slots have nowhere to go.
  if (tbd) return inner;
  return (
    <Link
      href={`/team/${team.abbrev}`}
      className="block transition-colors hover:bg-(--surface-hover)"
      aria-label={`${team.name.default} team page`}
    >
      {inner}
    </Link>
  );
}
