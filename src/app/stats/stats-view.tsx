"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { TeamLogo } from "@/components/team-logo";
import {
  STATS_KINDS,
  type GoalieStat,
  type SkaterStat,
  type StatsKind,
  type TeamStat,
  useGoalieStats,
  useSkaterStats,
  useTeamStats,
} from "@/lib/nhl/stats";
import { formatStatsKind, parseStatsKind } from "@/lib/url";

const LIMIT = 50;

const KIND_LABELS: Record<StatsKind, string> = {
  skater: "Skaters",
  goalie: "Goalies",
  team: "Teams",
};

export function StatsView() {
  const router = useRouter();
  const params = useSearchParams();
  const kind = parseStatsKind(params.get("kind"));

  const setKind = (next: StatsKind) => {
    const sp = new URLSearchParams(params);
    const formatted = formatStatsKind(next);
    if (formatted === null) sp.delete("kind");
    else sp.set("kind", formatted);
    const qs = sp.toString();
    router.replace(qs ? `/stats?${qs}` : "/stats");
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Stats</h1>
        <Tabs kind={kind} onChange={setKind} />
      </header>
      {kind === "skater" ? (
        <SkaterTable />
      ) : kind === "goalie" ? (
        <GoalieTable />
      ) : (
        <TeamTable />
      )}
    </div>
  );
}

function Tabs({
  kind,
  onChange,
}: {
  kind: StatsKind;
  onChange: (next: StatsKind) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-(--border) bg-(--surface) p-0.5 text-xs">
      {STATS_KINDS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={`rounded-full px-3 py-1 transition-colors ${
            kind === k
              ? "bg-(--bg) text-(--text) shadow-sm"
              : "text-(--text-muted)"
          }`}
        >
          {KIND_LABELS[k]}
        </button>
      ))}
    </div>
  );
}

function SkaterTable() {
  const query = useSkaterStats({ limit: LIMIT });
  return (
    <DataState
      isLoading={query.isLoading}
      error={query.error ?? null}
      hasData={Boolean(query.data)}
      skeleton={<Skeleton variant="row" count={10} />}
    >
      <Table
        head={
          <tr>
            <Th>#</Th>
            <Th>Player</Th>
            <Th align="right">GP</Th>
            <Th align="right">G</Th>
            <Th align="right" hideBelow="md">A</Th>
            <Th align="right">PTS</Th>
            <Th align="right" hideBelow="lg">+/-</Th>
            <Th align="right" hideBelow="lg">SH%</Th>
          </tr>
        }
      >
        {query.data?.data.map((row, i) => (
          <SkaterRow key={row.playerId} rank={i + 1} row={row} />
        ))}
      </Table>
    </DataState>
  );
}

function GoalieTable() {
  const query = useGoalieStats({ limit: LIMIT });
  return (
    <DataState
      isLoading={query.isLoading}
      error={query.error ?? null}
      hasData={Boolean(query.data)}
      skeleton={<Skeleton variant="row" count={10} />}
    >
      <Table
        head={
          <tr>
            <Th>#</Th>
            <Th>Goalie</Th>
            <Th align="right">GP</Th>
            <Th align="right">W</Th>
            <Th align="right" hideBelow="md">L</Th>
            <Th align="right" hideBelow="lg">SO</Th>
            <Th align="right">SV%</Th>
            <Th align="right" hideBelow="md">GAA</Th>
          </tr>
        }
      >
        {query.data?.data.map((row, i) => (
          <GoalieRow key={row.playerId} rank={i + 1} row={row} />
        ))}
      </Table>
    </DataState>
  );
}

function TeamTable() {
  const query = useTeamStats({ limit: LIMIT });
  return (
    <DataState
      isLoading={query.isLoading}
      error={query.error ?? null}
      hasData={Boolean(query.data)}
      skeleton={<Skeleton variant="row" count={10} />}
    >
      <Table
        head={
          <tr>
            <Th>#</Th>
            <Th>Team</Th>
            <Th align="right">GP</Th>
            <Th align="right">W</Th>
            <Th align="right" hideBelow="md">L</Th>
            <Th align="right">PTS</Th>
            <Th align="right" hideBelow="lg">GF/GP</Th>
            <Th align="right" hideBelow="lg">GA/GP</Th>
          </tr>
        }
      >
        {query.data?.data.map((row, i) => (
          <TeamRow key={row.teamId} rank={i + 1} row={row} />
        ))}
      </Table>
    </DataState>
  );
}

function Table({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-(--border) bg-(--surface)">
      <table className="w-full text-sm">
        <thead className="text-xs text-(--text-muted)">{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align = "left",
  hideBelow,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  hideBelow?: "md" | "lg";
}) {
  const hideClass =
    hideBelow === "md" ? "hidden md:table-cell" : hideBelow === "lg" ? "hidden lg:table-cell" : "";
  return (
    <th
      scope="col"
      className={`border-b border-(--border) px-2 py-2 ${
        align === "right" ? "text-right" : "text-left"
      } ${hideClass}`}
    >
      {children}
    </th>
  );
}

function SkaterRow({ rank, row }: { rank: number; row: SkaterStat }) {
  const team = row.teamAbbrevs.split(",")[0];
  return (
    <tr className="border-b border-(--border) last:border-0 hover:bg-(--surface-hover)">
      <td className="px-2 py-2 tabular-nums text-(--text-muted)">{rank}</td>
      <td className="px-2 py-2">
        <Link
          href={`/player/${row.playerId}`}
          className="inline-flex items-center gap-2 hover:underline"
        >
          <TeamLogo code={team} size={20} />
          <span className="font-medium">{row.skaterFullName}</span>
          <span className="text-(--text-muted)">{row.positionCode}</span>
        </Link>
      </td>
      <td className="px-2 py-2 text-right tabular-nums">{row.gamesPlayed}</td>
      <td className="px-2 py-2 text-right tabular-nums">{row.goals}</td>
      <td className="hidden px-2 py-2 text-right tabular-nums md:table-cell">{row.assists}</td>
      <td className="px-2 py-2 text-right font-semibold tabular-nums">{row.points}</td>
      <td className="hidden px-2 py-2 text-right tabular-nums lg:table-cell">
        {row.plusMinus ?? "-"}
      </td>
      <td className="hidden px-2 py-2 text-right tabular-nums lg:table-cell">
        {row.shootingPct != null ? (row.shootingPct * 100).toFixed(1) : "-"}
      </td>
    </tr>
  );
}

function GoalieRow({ rank, row }: { rank: number; row: GoalieStat }) {
  const team = row.teamAbbrevs.split(",")[0];
  return (
    <tr className="border-b border-(--border) last:border-0 hover:bg-(--surface-hover)">
      <td className="px-2 py-2 tabular-nums text-(--text-muted)">{rank}</td>
      <td className="px-2 py-2">
        <Link
          href={`/player/${row.playerId}`}
          className="inline-flex items-center gap-2 hover:underline"
        >
          <TeamLogo code={team} size={20} />
          <span className="font-medium">{row.goalieFullName}</span>
        </Link>
      </td>
      <td className="px-2 py-2 text-right tabular-nums">{row.gamesPlayed}</td>
      <td className="px-2 py-2 text-right tabular-nums">{row.wins}</td>
      <td className="hidden px-2 py-2 text-right tabular-nums md:table-cell">{row.losses}</td>
      <td className="hidden px-2 py-2 text-right tabular-nums lg:table-cell">
        {row.shutouts ?? "-"}
      </td>
      <td className="px-2 py-2 text-right font-semibold tabular-nums">
        {row.savePct != null ? row.savePct.toFixed(3) : "-"}
      </td>
      <td className="hidden px-2 py-2 text-right tabular-nums md:table-cell">
        {row.goalsAgainstAverage != null ? row.goalsAgainstAverage.toFixed(2) : "-"}
      </td>
    </tr>
  );
}

function TeamRow({ rank, row }: { rank: number; row: TeamStat }) {
  // Team-stats response gives teamFullName but not abbreviation. Linking by
  // code requires a name→code map we haven't built yet — defer to Phase 3.
  return (
    <tr className="border-b border-(--border) last:border-0 hover:bg-(--surface-hover)">
      <td className="px-2 py-2 tabular-nums text-(--text-muted)">{rank}</td>
      <td className="px-2 py-2 font-medium">{row.teamFullName}</td>
      <td className="px-2 py-2 text-right tabular-nums">{row.gamesPlayed}</td>
      <td className="px-2 py-2 text-right tabular-nums">{row.wins}</td>
      <td className="hidden px-2 py-2 text-right tabular-nums md:table-cell">{row.losses}</td>
      <td className="px-2 py-2 text-right font-semibold tabular-nums">{row.points}</td>
      <td className="hidden px-2 py-2 text-right tabular-nums lg:table-cell">
        {row.goalsForPerGame != null ? row.goalsForPerGame.toFixed(2) : "-"}
      </td>
      <td className="hidden px-2 py-2 text-right tabular-nums lg:table-cell">
        {row.goalsAgainstPerGame != null ? row.goalsAgainstPerGame.toFixed(2) : "-"}
      </td>
    </tr>
  );
}
