"use client";

import Image from "next/image";
import Link from "next/link";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { TeamLogo } from "@/components/team-logo";
import { usePlayer } from "@/lib/nhl/player";
import type { PlayerResponse } from "@/lib/nhl/player";

// Schema is .passthrough() so the rich totals/stats fields are present at
// runtime even though they aren't in the typed surface. Local extension type
// captures just what this page reads.
type SeasonTotal = {
  season: number;
  gameTypeId: number;
  leagueAbbrev: string;
  sequence?: number;
  teamName?: { default: string };
  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  pim?: number;
  // goalies
  wins?: number;
  losses?: number;
  shutouts?: number;
  goalsAgainstAvg?: number;
  savePctg?: number;
};
type CareerTotals = {
  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  pim?: number;
  wins?: number;
  losses?: number;
  shutouts?: number;
  goalsAgainstAvg?: number;
  savePctg?: number;
};
type RichPlayer = PlayerResponse & {
  seasonTotals?: SeasonTotal[];
  careerTotals?: { regularSeason?: CareerTotals; playoffs?: CareerTotals };
};

export function PlayerPage({ id }: { id: number }) {
  const player = usePlayer(id);
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <DataState
        isLoading={player.isLoading}
        error={player.error ?? null}
        hasData={Boolean(player.data)}
        skeleton={
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
            <Skeleton variant="card" />
            <Skeleton variant="row" count={8} />
          </div>
        }
        emptyState={
          <div className="px-4 py-12 text-center text-sm text-(--text-muted)">
            Player not found.
          </div>
        }
      >
        {player.data ? <Layout data={player.data as RichPlayer} /> : null}
      </DataState>
    </div>
  );
}

function Layout({ data }: { data: RichPlayer }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      <Bio data={data} />
      <Stats data={data} />
    </div>
  );
}

function Bio({ data }: { data: RichPlayer }) {
  const fullName = `${data.firstName.default} ${data.lastName.default}`;
  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-(--border) bg-(--surface)">
        <Image
          src={data.headshot}
          alt={fullName}
          width={300}
          height={300}
          className="h-auto w-full"
          priority
        />
      </div>
      <div>
        {data.sweaterNumber ? (
          <p className="text-xs uppercase tracking-wide text-(--text-muted)">
            #{data.sweaterNumber} · {data.position}
          </p>
        ) : (
          <p className="text-xs uppercase tracking-wide text-(--text-muted)">{data.position}</p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
      </div>
      {data.currentTeamAbbrev ? (
        <Link
          href={`/team/${data.currentTeamAbbrev}`}
          className="inline-flex items-center gap-2 text-sm hover:underline"
        >
          <TeamLogo code={data.currentTeamAbbrev} size={28} />
          <span>{data.fullTeamName?.default ?? data.currentTeamAbbrev}</span>
        </Link>
      ) : null}
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        {data.shootsCatches ? <Pair label="Shoots/Catches" value={data.shootsCatches} /> : null}
        {data.heightInInches ? (
          <Pair label="Height" value={formatHeight(data.heightInInches)} />
        ) : null}
        {data.weightInPounds ? <Pair label="Weight" value={`${data.weightInPounds} lb`} /> : null}
        {data.birthDate ? <Pair label="Born" value={data.birthDate} /> : null}
        {data.birthCity?.default ? (
          <Pair
            label="Birthplace"
            value={[data.birthCity.default, data.birthStateProvince?.default, data.birthCountry]
              .filter(Boolean)
              .join(", ")}
          />
        ) : null}
      </dl>
    </section>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-(--text-muted)">{label}</dt>
      <dd className="text-right">{value}</dd>
    </>
  );
}

function Stats({ data }: { data: RichPlayer }) {
  const isGoalie = data.position === "G";
  const seasons = (data.seasonTotals ?? []).filter(
    (s) => s.leagueAbbrev === "NHL" && s.gameTypeId === 2,
  );
  // Most recent first.
  seasons.sort((a, b) => b.season - a.season);

  return (
    <section className="rounded-lg border border-(--border) bg-(--surface)">
      <header className="border-b border-(--border) px-4 py-2">
        <h2 className="text-sm font-semibold tracking-tight">
          NHL — Regular season
        </h2>
      </header>
      {seasons.length === 0 ? (
        <p className="px-4 py-6 text-sm text-(--text-muted)">
          No NHL regular-season totals on record.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs text-(--text-muted)">
            {isGoalie ? <GoalieHead /> : <SkaterHead />}
          </thead>
          <tbody>
            {seasons.map((s, i) => (
              <Row key={`${s.season}-${s.sequence ?? i}`} season={s} highlight={i === 0} isGoalie={isGoalie} />
            ))}
            {data.careerTotals?.regularSeason ? (
              <Row
                season={{
                  season: 0,
                  gameTypeId: 2,
                  leagueAbbrev: "NHL",
                  teamName: { default: "Career" },
                  ...data.careerTotals.regularSeason,
                }}
                highlight={false}
                isGoalie={isGoalie}
                isCareer
              />
            ) : null}
          </tbody>
        </table>
      )}
    </section>
  );
}

function SkaterHead() {
  return (
    <tr className="border-b border-(--border)">
      <th scope="col" className="px-3 py-2 text-left">Season</th>
      <th scope="col" className="px-3 py-2 text-left">Team</th>
      <th scope="col" className="px-3 py-2 text-right">GP</th>
      <th scope="col" className="px-3 py-2 text-right">G</th>
      <th scope="col" className="px-3 py-2 text-right">A</th>
      <th scope="col" className="px-3 py-2 text-right">P</th>
      <th scope="col" className="hidden px-3 py-2 text-right md:table-cell">+/-</th>
      <th scope="col" className="hidden px-3 py-2 text-right md:table-cell">PIM</th>
    </tr>
  );
}

function GoalieHead() {
  return (
    <tr className="border-b border-(--border)">
      <th scope="col" className="px-3 py-2 text-left">Season</th>
      <th scope="col" className="px-3 py-2 text-left">Team</th>
      <th scope="col" className="px-3 py-2 text-right">GP</th>
      <th scope="col" className="px-3 py-2 text-right">W</th>
      <th scope="col" className="px-3 py-2 text-right">L</th>
      <th scope="col" className="hidden px-3 py-2 text-right md:table-cell">SO</th>
      <th scope="col" className="px-3 py-2 text-right">SV%</th>
      <th scope="col" className="hidden px-3 py-2 text-right md:table-cell">GAA</th>
    </tr>
  );
}

function Row({
  season,
  highlight,
  isGoalie,
  isCareer = false,
}: {
  season: SeasonTotal;
  highlight: boolean;
  isGoalie: boolean;
  isCareer?: boolean;
}) {
  const baseClass = "border-b border-(--border) last:border-0";
  const highlightClass = highlight ? " bg-(--accent)/10 font-semibold" : "";
  const careerClass = isCareer ? " border-t-2 border-(--border) text-(--text-muted)" : "";
  return (
    <tr className={baseClass + highlightClass + careerClass}>
      <td className="px-3 py-1 text-left tabular-nums">
        {isCareer ? "Career" : formatSeason(season.season)}
      </td>
      <td className="px-3 py-1 text-left">{season.teamName?.default ?? "—"}</td>
      <td className="px-3 py-1 text-right tabular-nums">{season.gamesPlayed ?? "—"}</td>
      {isGoalie ? (
        <>
          <td className="px-3 py-1 text-right tabular-nums">{season.wins ?? "—"}</td>
          <td className="px-3 py-1 text-right tabular-nums">{season.losses ?? "—"}</td>
          <td className="hidden px-3 py-1 text-right tabular-nums md:table-cell">{season.shutouts ?? "—"}</td>
          <td className="px-3 py-1 text-right tabular-nums">
            {season.savePctg != null ? season.savePctg.toFixed(3) : "—"}
          </td>
          <td className="hidden px-3 py-1 text-right tabular-nums md:table-cell">
            {season.goalsAgainstAvg != null ? season.goalsAgainstAvg.toFixed(2) : "—"}
          </td>
        </>
      ) : (
        <>
          <td className="px-3 py-1 text-right tabular-nums">{season.goals ?? "—"}</td>
          <td className="px-3 py-1 text-right tabular-nums">{season.assists ?? "—"}</td>
          <td className="px-3 py-1 text-right tabular-nums">{season.points ?? "—"}</td>
          <td className="hidden px-3 py-1 text-right tabular-nums md:table-cell">{season.plusMinus ?? "—"}</td>
          <td className="hidden px-3 py-1 text-right tabular-nums md:table-cell">{season.pim ?? "—"}</td>
        </>
      )}
    </tr>
  );
}

function formatHeight(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inchPart = inches % 12;
  return `${ft}'${inchPart}"`;
}

function formatSeason(season: number): string {
  // 20252026 → "2025–26"
  const s = String(season);
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}–${s.slice(6)}`;
}
