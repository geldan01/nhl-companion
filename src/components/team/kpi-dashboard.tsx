"use client";

import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { useTeam, type TeamGoalie } from "@/lib/nhl/team";
import type { StandingEntry } from "@/lib/nhl/standings";
import type { TeamScheduleGame } from "@/lib/nhl/teamSchedule";
import { useTeamSchedule } from "@/lib/nhl/teamSchedule";
import { getTeamColors, type TeamCode } from "@/lib/team-colors";
import {
  splitFor,
  topScorers,
  trendGames,
  type Split,
} from "@/lib/team-kpis";
import {
  ChartCard,
  GoalsTrendChart,
  ResultsBar,
  ScorerBars,
  StatCard,
} from "./kpi-charts";

const TREND_GAMES = 15;
const TOP_SCORERS = 8;

export function KpiDashboard({
  code,
  entry,
}: {
  code: string;
  entry: StandingEntry | undefined;
}) {
  const { primary } = getTeamColors(code as TeamCode);
  const team = useTeam(code);
  const schedule = useTeamSchedule(code);

  return (
    <div className="space-y-4 px-4 py-4">
      {entry ? <KpiCards entry={entry} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {entry ? (
          <ChartCard title="Results" aside={`${entry.gamesPlayed} GP`}>
            <ResultsBar
              wins={entry.wins}
              otLosses={entry.otLosses ?? 0}
              losses={entry.losses}
              accent={primary}
            />
            {entry.l10Wins != null ? (
              <p className="mt-3 text-xs text-(--text-muted)">
                Last 10: {entry.l10Wins}-{entry.l10Losses ?? 0}-{entry.l10OtLosses ?? 0}
              </p>
            ) : null}
          </ChartCard>
        ) : null}

        <ChartCard title="Goals trend" aside="for vs against">
          <DataState
            isLoading={schedule.isLoading}
            error={schedule.error ?? null}
            hasData={Boolean(schedule.data)}
            skeleton={<Skeleton variant="row" count={3} />}
          >
            {schedule.data ? (
              <GoalsTrendChart
                games={trendGames(code, schedule.data.games, TREND_GAMES)}
                accent={primary}
              />
            ) : null}
          </DataState>
        </ChartCard>
      </div>

      {schedule.data ? <SplitsRow code={code} games={schedule.data.games} /> : null}

      <DataState
        isLoading={team.isLoading}
        error={team.error ?? null}
        hasData={Boolean(team.data)}
        skeleton={<Skeleton variant="row" count={8} />}
      >
        {team.data ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Top scorers" aside="goals + assists">
              <ScorerBars rows={topScorers(team.data.skaters, TOP_SCORERS)} accent={primary} />
            </ChartCard>
            <ChartCard title="Goaltending">
              <GoalieTable goalies={team.data.goalies} />
            </ChartCard>
          </div>
        ) : null}
      </DataState>
    </div>
  );
}

function KpiCards({ entry }: { entry: StandingEntry }) {
  const gp = entry.gamesPlayed || 1;
  const diff = entry.goalDifferential;
  const ptsPct = entry.pointPctg != null ? `${Math.round(entry.pointPctg * 100)}% pts` : undefined;
  const streak =
    entry.streakCode && entry.streakCount
      ? `${entry.streakCode}${entry.streakCount}`
      : "—";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Record"
        value={`${entry.wins}-${entry.losses}-${entry.otLosses ?? 0}`}
        sub={`#${entry.leagueSequence} in league`}
      />
      <StatCard label="Points" value={entry.points} sub={ptsPct} />
      <StatCard
        label="Goals for"
        value={entry.goalFor}
        sub={`${(entry.goalFor / gp).toFixed(2)} / game`}
      />
      <StatCard
        label="Goals against"
        value={entry.goalAgainst}
        sub={`${(entry.goalAgainst / gp).toFixed(2)} / game`}
      />
      <StatCard
        label="Goal diff."
        value={diff > 0 ? `+${diff}` : diff}
        tone={diff > 0 ? "positive" : diff < 0 ? "negative" : "default"}
      />
      <StatCard label="Streak" value={streak} sub={`#${entry.divisionSequence} in div.`} />
    </div>
  );
}

function SplitsRow({ code, games }: { code: string; games: TeamScheduleGame[] }) {
  const home = splitFor(code, games, true);
  const away = splitFor(code, games, false);
  if (home.gp === 0 && away.gp === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <SplitCard title="Home" split={home} />
      <SplitCard title="Away" split={away} />
    </div>
  );
}

function SplitCard({ title, split }: { title: string; split: Split }) {
  return (
    <div className="rounded-xl border border-(--border) bg-(--surface) px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-(--text-muted)">
        {title}
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums">
        {split.wins}-{split.losses}-{split.otLosses}
      </div>
      <div className="mt-0.5 text-xs text-(--text-muted)">
        {split.gf} GF · {split.ga} GA · {split.gp} GP
      </div>
    </div>
  );
}

function GoalieTable({ goalies }: { goalies: TeamGoalie[] }) {
  const active = goalies
    .filter((g) => (g.gamesPlayed ?? 0) > 0)
    .sort((a, b) => (b.gamesPlayed ?? 0) - (a.gamesPlayed ?? 0));
  if (active.length === 0) {
    return <p className="text-sm text-(--text-muted)">No goalie data yet.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-(--text-muted)">
        <tr className="border-b border-(--border)">
          <th scope="col" className="py-1 text-left">Goalie</th>
          <th scope="col" className="py-1 text-right">GP</th>
          <th scope="col" className="py-1 text-right">Record</th>
          <th scope="col" className="py-1 text-right">SV%</th>
          <th scope="col" className="py-1 text-right">GAA</th>
        </tr>
      </thead>
      <tbody>
        {active.map((g) => (
          <tr key={g.playerId} className="border-b border-(--border) last:border-0">
            <td className="py-1">
              <a href={`/player/${g.playerId}`} className="hover:underline">
                {g.firstName.default} {g.lastName.default}
              </a>
            </td>
            <td className="py-1 text-right tabular-nums">{g.gamesPlayed ?? 0}</td>
            <td className="py-1 text-right tabular-nums">
              {g.wins ?? 0}-{g.losses ?? 0}-{g.overtimeLosses ?? 0}
            </td>
            <td className="py-1 text-right tabular-nums">
              {g.savePercentage != null ? g.savePercentage.toFixed(3).replace(/^0/, "") : "—"}
            </td>
            <td className="py-1 text-right tabular-nums">
              {g.goalsAgainstAverage != null ? g.goalsAgainstAverage.toFixed(2) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
