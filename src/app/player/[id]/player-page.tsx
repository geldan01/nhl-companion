"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { DataState } from "@/components/data-state";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Skeleton } from "@/components/skeleton";
import { TeamLogo } from "@/components/team-logo";
import { usePlayer } from "@/lib/nhl/player";
import type { PlayerResponse } from "@/lib/nhl/player";
import { getTeamColors } from "@/lib/team-colors";

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
    <DataState
      isLoading={player.isLoading}
      error={player.error ?? null}
      hasData={Boolean(player.data)}
      skeleton={
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
            <Skeleton variant="card" />
            <Skeleton variant="row" count={8} />
          </div>
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
  );
}

function Layout({ data }: { data: RichPlayer }) {
  const { primary } = getTeamColors(data.currentTeamAbbrev ?? "");
  // Same subtle team-color wash used on the team page — radial glow at top,
  // thin linear tint fading out around 40% of the page height.
  const background = `
    radial-gradient(ellipse 95% 55% at 50% 0%, ${primary}66, transparent 65%),
    linear-gradient(180deg, ${primary}1F, transparent 40%)
  `;
  return (
    <div className="relative min-h-full" style={{ background }}>
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <Hero data={data} />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <Bio data={data} />
          <Stats data={data} />
        </div>
      </div>
    </div>
  );
}

function Hero({ data }: { data: RichPlayer }) {
  const fullName = `${data.firstName.default} ${data.lastName.default}`;
  const teamCode = data.currentTeamAbbrev;
  const teamName = data.fullTeamName?.default ?? teamCode;
  const eyebrow = data.sweaterNumber
    ? `#${data.sweaterNumber} · ${positionFullName(data.position)}`
    : positionFullName(data.position);
  const { primary, secondary } = getTeamColors(teamCode ?? "");

  return (
    <header className="pt-4 pb-2 sm:pt-8 sm:pb-4">
      <div className="flex items-center gap-5 sm:gap-8">
        {/* Medal-style headshot moved into the hero so the page doesn't
            land with a half-empty fold. Falls back to InitialsAvatar on
            CDN miss. */}
        <div className="shrink-0 w-32 sm:w-40 lg:w-48">
          <HeroHeadshot
            url={data.headshot}
            name={fullName}
            primary={primary}
            secondary={secondary}
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-(--text-muted) sm:text-sm">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {fullName}
          </h1>
          {teamCode ? (
            <Link
              href={`/team/${teamCode}`}
              className="mt-3 inline-flex items-center gap-3 hover:underline"
            >
              <TeamLogo code={teamCode} size={32} bare />
              <span className="text-base font-semibold sm:text-lg lg:text-xl">{teamName}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function HeroHeadshot({
  url,
  name,
  primary,
  secondary,
}: {
  url: string;
  name: string;
  primary: string;
  secondary: string;
}) {
  const [errored, setErrored] = useState(false);
  return (
    <div
      className="aspect-square rounded-full p-0.75 shadow-xl"
      style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-(--surface) ring-2 ring-(--bg)">
        {url && !errored ? (
          <Image
            src={url}
            alt={name}
            width={300}
            height={300}
            className="h-full w-full object-cover"
            priority
            onError={() => setErrored(true)}
          />
        ) : (
          <InitialsAvatar
            name={name}
            size={192}
            rounded="full"
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  );
}

function Bio({ data }: { data: RichPlayer }) {
  return (
    <section>
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

function positionFullName(p: string): string {
  switch (p) {
    case "C": return "Center";
    case "L": return "Left Wing";
    case "R": return "Right Wing";
    case "D": return "Defense";
    case "G": return "Goalie";
    default: return p;
  }
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
  const { primary } = getTeamColors(data.currentTeamAbbrev ?? "");

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
              <Row
                key={`${s.season}-${s.sequence ?? i}`}
                season={s}
                highlight={i === 0}
                highlightColor={primary}
                isGoalie={isGoalie}
              />
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
  highlightColor,
  isGoalie,
  isCareer = false,
}: {
  season: SeasonTotal;
  highlight: boolean;
  highlightColor?: string;
  isGoalie: boolean;
  isCareer?: boolean;
}) {
  const baseClass = "border-b border-(--border) last:border-0";
  const highlightClass = highlight ? " font-semibold" : "";
  const careerClass = isCareer ? " border-t-2 border-(--border) text-(--text-muted)" : "";
  // `highlightColor` is the team's primary hex (e.g. "#041E42"). Append a
  // 1A alpha (~10%) for a soft team-tinted row instead of the generic blue
  // `bg-(--accent)/10` we used before.
  const highlightStyle =
    highlight && highlightColor
      ? { backgroundColor: `${highlightColor}1A` }
      : undefined;
  return (
    <tr className={baseClass + highlightClass + careerClass} style={highlightStyle}>
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
