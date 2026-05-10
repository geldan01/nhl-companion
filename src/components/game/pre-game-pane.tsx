"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { TeamLogo } from "@/components/team-logo";
import type { GameResponse } from "@/lib/nhl/game";
import type { StandingEntry } from "@/lib/nhl/standings";
import { useStandings } from "@/lib/nhl/standings";
import type { TeamScheduleGame, TeamScheduleResponse } from "@/lib/nhl/teamSchedule";
import { useTeamSchedule } from "@/lib/nhl/teamSchedule";
import { getTeamColors, type TeamCode } from "@/lib/team-colors";

// The game schema is .passthrough(); these fields ride along on the runtime
// payload but aren't on the typed surface. Mirror what we need for pre-game.
type Broadcast = { network: string; market: string; countryCode: string };
type LocalizedString = { default: string };
type GameWithPreGameInfo = GameResponse & {
  venue?: LocalizedString;
  venueLocation?: LocalizedString;
  venueTimezone?: string;
  tvBroadcasts?: Broadcast[];
};

export function PreGamePane({ game }: { game: GameResponse }) {
  const g = game as GameWithPreGameInfo;
  const away = g.awayTeam.abbrev;
  const home = g.homeTeam.abbrev;
  const standings = useStandings();
  const awaySchedule = useTeamSchedule(away);
  const homeSchedule = useTeamSchedule(home);

  const awayEntry = standings.data?.standings.find(
    (s) => s.teamAbbrev.default === away,
  );
  const homeEntry = standings.data?.standings.find(
    (s) => s.teamAbbrev.default === home,
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6">
      <MatchupHero game={g} awayEntry={awayEntry} homeEntry={homeEntry} />
      <GameInfoCard game={g} />
      <StandingsStrip
        awayCode={away}
        homeCode={home}
        awayEntry={awayEntry}
        homeEntry={homeEntry}
        isLoading={standings.isLoading}
      />
      <RecentFormSection
        awayCode={away}
        homeCode={home}
        awayQuery={awaySchedule}
        homeQuery={homeSchedule}
      />
      <SeasonSeriesSection
        awayCode={away}
        homeCode={home}
        awayQuery={awaySchedule}
      />
    </div>
  );
}

function MatchupHero({
  game,
  awayEntry,
  homeEntry,
}: {
  game: GameWithPreGameInfo;
  awayEntry: StandingEntry | undefined;
  homeEntry: StandingEntry | undefined;
}) {
  const { primary: awayColor } = getTeamColors(game.awayTeam.abbrev as TeamCode);
  const { primary: homeColor } = getTeamColors(game.homeTeam.abbrev as TeamCode);
  const background = `
    radial-gradient(ellipse 55% 80% at 15% 30%, ${awayColor}55, transparent 65%),
    radial-gradient(ellipse 55% 80% at 85% 30%, ${homeColor}55, transparent 65%)
  `;

  return (
    <section
      className="relative overflow-hidden rounded-xl border border-(--border) bg-(--surface) px-4 py-8 sm:px-8 sm:py-12"
      style={{ background }}
      aria-label="Matchup"
    >
      <div className="flex items-center justify-between gap-4 sm:gap-8">
        <TeamSide team={game.awayTeam} entry={awayEntry} align="start" />
        <div
          className="shrink-0 text-2xl font-bold uppercase tracking-widest text-(--text-muted) sm:text-3xl"
          aria-hidden
        >
          @
        </div>
        <TeamSide team={game.homeTeam} entry={homeEntry} align="end" />
      </div>
    </section>
  );
}

function TeamSide({
  team,
  entry,
  align,
}: {
  team: GameResponse["awayTeam"];
  entry: StandingEntry | undefined;
  align: "start" | "end";
}) {
  const fullName = `${team.placeName.default} ${team.commonName.default}`;
  const record = entry
    ? `${entry.wins}-${entry.losses}-${entry.otLosses ?? 0}`
    : null;
  const alignment = align === "end" ? "items-end text-right" : "items-start text-left";

  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-2 ${alignment}`}>
      <Link
        href={`/team/${team.abbrev}`}
        aria-label={fullName}
        className="inline-flex"
      >
        <TeamLogo
          code={team.abbrev}
          size="min(28vw, 160px)"
          bare
          className="shrink-0"
        />
      </Link>
      <Link
        href={`/team/${team.abbrev}`}
        className="truncate text-lg font-bold tracking-tight hover:underline sm:text-2xl"
      >
        {fullName}
      </Link>
      {record ? (
        <span className="text-xs tabular-nums text-(--text-muted) sm:text-sm">
          {record}
        </span>
      ) : null}
    </div>
  );
}

function GameInfoCard({ game }: { game: GameWithPreGameInfo }) {
  return (
    <section
      className="grid gap-4 rounded-xl border border-(--border) bg-(--surface) p-4 sm:grid-cols-3"
      aria-label="Game info"
    >
      <InfoBlock label="Puck drop">
        <StartTime iso={game.startTimeUTC} />
      </InfoBlock>
      <InfoBlock label="Venue">
        {game.venue?.default ? (
          <>
            <div className="text-sm font-semibold">{game.venue.default}</div>
            {game.venueLocation?.default ? (
              <div className="text-xs text-(--text-muted)">
                {game.venueLocation.default}
              </div>
            ) : null}
          </>
        ) : (
          <span className="text-sm text-(--text-muted)">—</span>
        )}
      </InfoBlock>
      <InfoBlock label="Broadcasts">
        <Broadcasts list={game.tvBroadcasts ?? []} />
      </InfoBlock>
    </section>
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-(--text-muted)">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StartTime({ iso }: { iso: string }) {
  const date = new Date(iso);
  const valid = !Number.isNaN(date.getTime());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!valid) {
    return <span className="text-sm text-(--text-muted)">Time TBD</span>;
  }
  const dayLabel = date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const diffMs = date.getTime() - now;
  let countdown: string | null = null;
  if (diffMs > 0) {
    const totalMin = Math.floor(diffMs / 60_000);
    const days = Math.floor(totalMin / (60 * 24));
    const hours = Math.floor((totalMin % (60 * 24)) / 60);
    const minutes = totalMin % 60;
    if (days > 0) countdown = `in ${days}d ${hours}h`;
    else if (hours > 0) countdown = `in ${hours}h ${minutes}m`;
    else countdown = `in ${Math.max(1, minutes)}m`;
  } else {
    countdown = "starting soon";
  }
  return (
    <div>
      <div className="text-sm font-semibold">{dayLabel}</div>
      <div className="text-xs text-(--text-muted)">{timeLabel}</div>
      <div className="mt-1 text-xs text-(--accent)">Puck drops {countdown}</div>
    </div>
  );
}

function Broadcasts({ list }: { list: Broadcast[] }) {
  if (list.length === 0) {
    return <span className="text-sm text-(--text-muted)">TBD</span>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5" role="list">
      {list.map((b, i) => (
        <li
          key={`${b.network}-${b.countryCode}-${i}`}
          className="inline-flex items-center gap-1 rounded-full border border-(--border) px-2 py-0.5 text-[11px] font-medium"
        >
          <span>{b.network}</span>
          <span className="text-[10px] text-(--text-muted)">{b.countryCode}</span>
        </li>
      ))}
    </ul>
  );
}

function StandingsStrip({
  awayCode,
  homeCode,
  awayEntry,
  homeEntry,
  isLoading,
}: {
  awayCode: string;
  homeCode: string;
  awayEntry: StandingEntry | undefined;
  homeEntry: StandingEntry | undefined;
  isLoading: boolean;
}) {
  if (isLoading && !awayEntry && !homeEntry) {
    return (
      <section
        aria-label="Standings"
        className="rounded-xl border border-(--border) bg-(--surface) p-4"
      >
        <Skeleton variant="row" count={2} />
      </section>
    );
  }
  if (!awayEntry && !homeEntry) return null;

  return (
    <section
      aria-label="Standings"
      className="rounded-xl border border-(--border) bg-(--surface) p-4"
    >
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-(--text-muted)">
        Standings
      </h2>
      <div className="space-y-2">
        <StandingsRow code={awayCode} entry={awayEntry} />
        <StandingsRow code={homeCode} entry={homeEntry} />
      </div>
    </section>
  );
}

function StandingsRow({
  code,
  entry,
}: {
  code: string;
  entry: StandingEntry | undefined;
}) {
  if (!entry) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <TeamLogo code={code} size={24} />
        <span className="font-medium">{code}</span>
        <span className="ml-auto text-xs text-(--text-muted)">—</span>
      </div>
    );
  }
  const record = `${entry.wins}-${entry.losses}-${entry.otLosses ?? 0}`;
  const gd =
    entry.goalDifferential > 0
      ? `+${entry.goalDifferential}`
      : String(entry.goalDifferential);
  const streak =
    entry.streakCode && entry.streakCount
      ? `${entry.streakCode}${entry.streakCount}`
      : null;
  const l10 =
    typeof entry.l10Wins === "number"
      ? `${entry.l10Wins}-${entry.l10Losses ?? 0}-${entry.l10OtLosses ?? 0}`
      : null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <TeamLogo code={code} size={24} />
      <span className="font-medium">{code}</span>
      <span className="text-xs text-(--text-muted)">
        #{entry.divisionSequence} {entry.divisionName}
      </span>
      <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
        <Stat label="Rec" value={record} />
        <Stat label="Pts" value={String(entry.points)} />
        <Stat label="GD" value={gd} />
        {streak ? <Stat label="Str" value={streak} /> : null}
        {l10 ? <Stat label="L10" value={l10} /> : null}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 text-xs">
      <span className="text-(--text-muted)">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

type ScheduleQuery = {
  data: TeamScheduleResponse | undefined;
  isLoading: boolean;
};

function RecentFormSection({
  awayCode,
  homeCode,
  awayQuery,
  homeQuery,
}: {
  awayCode: string;
  homeCode: string;
  awayQuery: ScheduleQuery;
  homeQuery: ScheduleQuery;
}) {
  return (
    <section
      aria-label="Recent form"
      className="rounded-xl border border-(--border) bg-(--surface) p-4"
    >
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-(--text-muted)">
        Recent form
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <RecentFormForTeam code={awayCode} query={awayQuery} />
        <RecentFormForTeam code={homeCode} query={homeQuery} />
      </div>
    </section>
  );
}

function RecentFormForTeam({
  code,
  query,
}: {
  code: string;
  query: ScheduleQuery;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <TeamLogo code={code} size={20} />
        <span className="text-sm font-semibold">{code}</span>
      </div>
      <DataState
        isLoading={query.isLoading}
        error={null}
        hasData={Boolean(query.data)}
        skeleton={<Skeleton variant="row" count={3} />}
      >
        {query.data ? (
          <RecentFormList code={code} games={query.data.games} />
        ) : null}
      </DataState>
    </div>
  );
}

function RecentFormList({
  code,
  games,
}: {
  code: string;
  games: TeamScheduleGame[];
}) {
  const today = todayUtc();
  const past = games
    .filter((g) => g.gameType === 2 || g.gameType === 3)
    .filter((g) => g.gameDate < today)
    .filter(
      (g) => g.gameState === "FINAL" || g.gameState === "OFF",
    )
    .sort((a, b) => b.gameDate.localeCompare(a.gameDate))
    .slice(0, 5);

  if (past.length === 0) {
    return <p className="text-xs text-(--text-muted)">No prior games.</p>;
  }

  return (
    <ul role="list" className="space-y-1">
      {past.map((g) => {
        const result = outcomeFor(code, g);
        const isHome = g.homeTeam.abbrev === code;
        const opponent = isHome ? g.awayTeam : g.homeTeam;
        return (
          <li key={g.id} className="flex items-center gap-2 text-xs">
            <ResultChip outcome={result?.outcome ?? "—"} />
            <span className="w-16 shrink-0 tabular-nums text-(--text-muted)">
              {g.gameDate}
            </span>
            <span className="text-(--text-muted)">{isHome ? "vs" : "@"}</span>
            <TeamLogo code={opponent.abbrev} size={16} />
            <Link
              href={`/game/${g.id}`}
              className="font-medium hover:underline"
            >
              {opponent.abbrev}
            </Link>
            {result ? (
              <span className="ml-auto tabular-nums">
                {result.scoreFor}-{result.scoreAgainst}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ResultChip({ outcome }: { outcome: "W" | "L" | "OTL" | "—" }) {
  const cls =
    outcome === "W"
      ? "bg-(--accent) text-black"
      : outcome === "L"
        ? "bg-(--border) text-(--text-muted)"
        : outcome === "OTL"
          ? "bg-(--border) text-(--text)"
          : "bg-(--border) text-(--text-muted)";
  return (
    <span
      className={`inline-flex h-5 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold tabular-nums ${cls}`}
    >
      {outcome}
    </span>
  );
}

function SeasonSeriesSection({
  awayCode,
  homeCode,
  awayQuery,
}: {
  awayCode: string;
  homeCode: string;
  awayQuery: ScheduleQuery;
}) {
  return (
    <section
      aria-label="Season series"
      className="rounded-xl border border-(--border) bg-(--surface) p-4"
    >
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-(--text-muted)">
        Season series
      </h2>
      <DataState
        isLoading={awayQuery.isLoading}
        error={null}
        hasData={Boolean(awayQuery.data)}
        skeleton={<Skeleton variant="row" count={2} />}
      >
        {awayQuery.data ? (
          <SeasonSeriesList
            awayCode={awayCode}
            homeCode={homeCode}
            games={awayQuery.data.games}
          />
        ) : null}
      </DataState>
    </section>
  );
}

function SeasonSeriesList({
  awayCode,
  homeCode,
  games,
}: {
  awayCode: string;
  homeCode: string;
  games: TeamScheduleGame[];
}) {
  const prior = games
    .filter((g) => g.gameType === 2 || g.gameType === 3)
    .filter(
      (g) =>
        (g.homeTeam.abbrev === homeCode && g.awayTeam.abbrev === awayCode) ||
        (g.homeTeam.abbrev === awayCode && g.awayTeam.abbrev === homeCode),
    )
    .filter((g) => g.gameState === "FINAL" || g.gameState === "OFF")
    .sort((a, b) => a.gameDate.localeCompare(b.gameDate));

  if (prior.length === 0) {
    return (
      <p className="text-sm text-(--text-muted)">First meeting of the season.</p>
    );
  }

  let awayWins = 0;
  let homeWins = 0;
  for (const g of prior) {
    const awayScore = g.awayTeam.score ?? 0;
    const homeScore = g.homeTeam.score ?? 0;
    const winnerAbbrev =
      awayScore > homeScore ? g.awayTeam.abbrev : g.homeTeam.abbrev;
    if (winnerAbbrev === awayCode) awayWins++;
    else if (winnerAbbrev === homeCode) homeWins++;
  }

  return (
    <div>
      <p className="mb-2 text-xs text-(--text-muted)">
        {awayCode} {awayWins} – {homeWins} {homeCode}
      </p>
      <ul role="list" className="divide-y divide-(--border)">
        {prior.map((g) => (
          <li
            key={g.id}
            className="flex items-center gap-3 py-2 text-sm"
          >
            <span className="w-20 shrink-0 text-xs tabular-nums text-(--text-muted)">
              {g.gameDate}
            </span>
            <Link
              href={`/game/${g.id}`}
              className="flex flex-1 items-center gap-2 hover:underline"
            >
              <TeamLogo code={g.awayTeam.abbrev} size={16} />
              <span className="font-medium">{g.awayTeam.abbrev}</span>
              <span className="tabular-nums">{g.awayTeam.score ?? "—"}</span>
              <span className="text-(--text-muted)">@</span>
              <TeamLogo code={g.homeTeam.abbrev} size={16} />
              <span className="font-medium">{g.homeTeam.abbrev}</span>
              <span className="tabular-nums">{g.homeTeam.score ?? "—"}</span>
            </Link>
            {g.gameOutcome?.lastPeriodType &&
            g.gameOutcome.lastPeriodType !== "REG" ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-(--text-muted)">
                {g.gameOutcome.lastPeriodType}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

type Outcome = "W" | "L" | "OTL" | "—";

function outcomeFor(
  code: string,
  game: TeamScheduleGame,
): { outcome: Outcome; scoreFor: number; scoreAgainst: number } | null {
  const isHome = game.homeTeam.abbrev === code;
  const our = isHome ? game.homeTeam.score : game.awayTeam.score;
  const their = isHome ? game.awayTeam.score : game.homeTeam.score;
  if (typeof our !== "number" || typeof their !== "number") return null;
  const lastPeriodType = game.gameOutcome?.lastPeriodType;
  let outcome: Outcome;
  if (our > their) outcome = "W";
  else if (our < their && (lastPeriodType === "OT" || lastPeriodType === "SO"))
    outcome = "OTL";
  else if (our < their) outcome = "L";
  else outcome = "—";
  return { outcome, scoreFor: our, scoreAgainst: their };
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
