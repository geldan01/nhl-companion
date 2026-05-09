"use client";

import Link from "next/link";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import {
  type BoxscoreGoalie,
  type BoxscoreResponse,
  type BoxscoreSkater,
  useBoxscore,
} from "@/lib/nhl/boxscore";

export function BoxPane({ id }: { id: number }) {
  const query = useBoxscore(id);
  return (
    <DataState
      isLoading={query.isLoading}
      error={query.error ?? null}
      hasData={Boolean(query.data)}
      skeleton={<div className="p-3"><Skeleton variant="row" count={6} /></div>}
    >
      {query.data ? <Box data={query.data} /> : null}
    </DataState>
  );
}

function Box({ data }: { data: BoxscoreResponse }) {
  const away = aggregateTeam(
    data.awayTeam.sog,
    data.playerByGameStats.awayTeam.forwards,
    data.playerByGameStats.awayTeam.defense,
  );
  const home = aggregateTeam(
    data.homeTeam.sog,
    data.playerByGameStats.homeTeam.forwards,
    data.playerByGameStats.homeTeam.defense,
  );

  return (
    <div className="p-3 text-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
        Team stats
      </h3>
      <table className="w-full">
        <thead className="text-xs text-(--text-muted)">
          <tr className="border-b border-(--border)">
            <th scope="col" className="py-1 text-left">{data.awayTeam.abbrev}</th>
            <th scope="col" className="py-1 text-center">Stat</th>
            <th scope="col" className="py-1 text-right">{data.homeTeam.abbrev}</th>
          </tr>
        </thead>
        <tbody>
          <StatRow label="Shots" away={away.sog} home={home.sog} />
          <StatRow label="PIM" away={away.pim} home={home.pim} />
          <StatRow label="Hits" away={away.hits} home={home.hits} />
          <StatRow label="Blocks" away={away.blocks} home={home.blocks} />
          <StatRow label="Giveaways" away={away.giveaways} home={home.giveaways} />
          <StatRow label="Takeaways" away={away.takeaways} home={home.takeaways} />
          <StatRow label="PP goals" away={away.ppGoals} home={home.ppGoals} />
          <StatRow
            label="FO%"
            away={formatPct(away.foPct)}
            home={formatPct(home.foPct)}
          />
        </tbody>
      </table>

      <TeamSection
        label={data.awayTeam.abbrev}
        forwards={data.playerByGameStats.awayTeam.forwards}
        defense={data.playerByGameStats.awayTeam.defense}
        goalies={data.playerByGameStats.awayTeam.goalies}
      />
      <TeamSection
        label={data.homeTeam.abbrev}
        forwards={data.playerByGameStats.homeTeam.forwards}
        defense={data.playerByGameStats.homeTeam.defense}
        goalies={data.playerByGameStats.homeTeam.goalies}
      />
    </div>
  );
}

type TeamAgg = {
  sog: number;
  pim: number;
  hits: number;
  blocks: number;
  giveaways: number;
  takeaways: number;
  ppGoals: number;
  foPct: number | null;
};

function aggregateTeam(
  sogFromTeam: number | undefined,
  forwards: BoxscoreSkater[],
  defense: BoxscoreSkater[],
): TeamAgg {
  const skaters = [...forwards, ...defense];
  const sum = (sel: (s: BoxscoreSkater) => number | undefined) =>
    skaters.reduce((acc, s) => acc + (sel(s) ?? 0), 0);

  const foPctValues = skaters
    .map((s) => s.faceoffWinningPctg)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const foPct =
    foPctValues.length > 0
      ? foPctValues.reduce((a, b) => a + b, 0) / foPctValues.length
      : null;

  return {
    sog: sogFromTeam ?? sum((s) => s.sog),
    pim: sum((s) => s.pim),
    hits: sum((s) => s.hits),
    blocks: sum((s) => s.blockedShots),
    giveaways: sum((s) => s.giveaways),
    takeaways: sum((s) => s.takeaways),
    ppGoals: sum((s) => s.powerPlayGoals),
    foPct,
  };
}

function formatPct(v: number | null): string {
  if (v === null) return "—";
  return `${(v * 100).toFixed(0)}%`;
}

function StatRow({
  label,
  away,
  home,
}: {
  label: string;
  away: number | string;
  home: number | string;
}) {
  return (
    <tr className="border-b border-(--border) last:border-0">
      <td className="py-1 text-left tabular-nums">{away}</td>
      <td className="py-1 text-center text-xs text-(--text-muted)">{label}</td>
      <td className="py-1 text-right tabular-nums">{home}</td>
    </tr>
  );
}

function TeamSection({
  label,
  forwards,
  defense,
  goalies,
}: {
  label: string;
  forwards: BoxscoreSkater[];
  defense: BoxscoreSkater[];
  goalies: BoxscoreGoalie[];
}) {
  return (
    <details className="mt-4 rounded border border-(--border)">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
        {label} skaters / goalies
      </summary>
      <div className="border-t border-(--border) p-2 text-xs">
        <SkaterTable title="Forwards" rows={forwards} />
        <SkaterTable title="Defense" rows={defense} />
        <GoalieTable rows={goalies} />
      </div>
    </details>
  );
}

function SkaterTable({ title, rows }: { title: string; rows: BoxscoreSkater[] }) {
  return (
    <div className="mb-2">
      <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-(--text-muted)">
        {title}
      </h4>
      <table className="w-full">
        <thead className="text-(--text-muted)">
          <tr>
            <th scope="col" className="text-left">Player</th>
            <th scope="col" className="text-right">G</th>
            <th scope="col" className="text-right">A</th>
            <th scope="col" className="text-right">+/-</th>
            <th scope="col" className="text-right">SOG</th>
            <th scope="col" className="text-right">TOI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.playerId} className="border-b border-(--border) last:border-0">
              <td className="py-1 text-left">
                <Link href={`/player/${p.playerId}`} className="hover:underline">
                  {p.name.default}
                </Link>
              </td>
              <td className="py-1 text-right tabular-nums">{p.goals ?? 0}</td>
              <td className="py-1 text-right tabular-nums">{p.assists ?? 0}</td>
              <td className="py-1 text-right tabular-nums">{p.plusMinus ?? 0}</td>
              <td className="py-1 text-right tabular-nums">{p.sog ?? 0}</td>
              <td className="py-1 text-right tabular-nums text-(--text-muted)">{p.toi ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GoalieTable({ rows }: { rows: BoxscoreGoalie[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-(--text-muted)">
        Goalies
      </h4>
      <table className="w-full">
        <thead className="text-(--text-muted)">
          <tr>
            <th scope="col" className="text-left">Goalie</th>
            <th scope="col" className="text-right">SV</th>
            <th scope="col" className="text-right">SA</th>
            <th scope="col" className="text-right">GA</th>
            <th scope="col" className="text-right">TOI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.playerId} className="border-b border-(--border) last:border-0">
              <td className="py-1 text-left">
                <Link href={`/player/${g.playerId}`} className="hover:underline">
                  {g.name.default}
                </Link>
              </td>
              <td className="py-1 text-right tabular-nums">{g.saves ?? "—"}</td>
              <td className="py-1 text-right tabular-nums">{g.shotsAgainst ?? "—"}</td>
              <td className="py-1 text-right tabular-nums">{g.goalsAgainst ?? "—"}</td>
              <td className="py-1 text-right tabular-nums text-(--text-muted)">{g.toi ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
