"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DataState } from "@/components/data-state";
import { GameStatePill } from "@/components/game-state-pill";
import { Skeleton } from "@/components/skeleton";
import { TeamLogo } from "@/components/team-logo";
import { KpiDashboard } from "@/components/team/kpi-dashboard";
import type { RosterPlayer, RosterResponse } from "@/lib/nhl/roster";
import { useRoster } from "@/lib/nhl/roster";
import type { StandingEntry } from "@/lib/nhl/standings";
import { useStandings } from "@/lib/nhl/standings";
import type { TeamScheduleGame } from "@/lib/nhl/teamSchedule";
import { useTeamSchedule } from "@/lib/nhl/teamSchedule";
import { getTeamColors, teamFullName, type TeamCode } from "@/lib/team-colors";

const TABS = [
  { key: "roster", label: "Roster" },
  { key: "dashboard", label: "Dashboard" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function parseTab(value: string | null): TabKey {
  return value === "dashboard" ? "dashboard" : "roster";
}

export function TeamPage({ code }: { code: string }) {
  const { primary } = getTeamColors(code as TeamCode);

  const router = useRouter();
  const params = useSearchParams();
  const tab = parseTab(params.get("tab"));

  const setTab = (next: TabKey) => {
    const sp = new URLSearchParams(params);
    if (next === "roster") sp.delete("tab");
    else sp.set("tab", next);
    const qs = sp.toString();
    router.replace(qs ? `/team/${code}?${qs}` : `/team/${code}`);
  };

  // Subscribe to standings so cold visits show division/record too. Same
  // React Query key as /standings → no extra network on warm cache. Shared by
  // the header and the dashboard's KPI cards.
  const standings = useStandings();
  const entry = standings.data?.standings.find(
    (s) => s.teamAbbrev.default === code,
  );

  // Subtle team-color wash. Stacked layers:
  //   • radial glow at the top behind the hero (~40% alpha)
  //   • thin linear tint that fades out around 40% of the page height
  // Hex suffixes are 8-bit alpha — `66` ≈ 40%, `1F` ≈ 12%.
  const background = `
    radial-gradient(ellipse 95% 55% at 50% 0%, ${primary}66, transparent 65%),
    linear-gradient(180deg, ${primary}1F, transparent 40%)
  `;

  return (
    <div className="relative min-h-full" style={{ background }}>
      <div className="mx-auto w-full max-w-5xl">
        <Header code={code} entry={entry} />
        <div className="px-4">
          <Tabs tab={tab} onChange={setTab} />
        </div>
        {tab === "dashboard" ? (
          <KpiDashboard code={code} entry={entry} />
        ) : (
          <RosterTab code={code} />
        )}
      </div>
    </div>
  );
}

function Tabs({ tab, onChange }: { tab: TabKey; onChange: (next: TabKey) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Team views"
      className="inline-flex rounded-full border border-(--border) bg-(--surface) p-0.5 text-sm"
    >
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={tab === t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-full px-4 py-1 transition-colors ${
            tab === t.key
              ? "bg-(--bg) text-(--text) shadow-sm"
              : "text-(--text-muted) hover:text-(--text)"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function RosterTab({ code }: { code: string }) {
  const roster = useRoster(code);
  return (
    <DataState
      isLoading={roster.isLoading}
      error={roster.error ?? null}
      hasData={Boolean(roster.data)}
      skeleton={
        <div className="px-4 py-4">
          <Skeleton variant="row" count={6} />
        </div>
      }
    >
      {roster.data ? <Sections code={code} roster={roster.data} /> : null}
    </DataState>
  );
}

function Header({ code, entry }: { code: string; entry: StandingEntry | undefined }) {
  // Prefer the live standings name (which carries diacritics correctly via
  // the API's localized strings); fall back to our static full-name map so
  // we never display the bare 3-letter code.
  const name =
    entry?.placeName.default && entry.teamCommonName.default
      ? `${entry.placeName.default} ${entry.teamCommonName.default}`
      : teamFullName(code);
  const division = entry?.divisionName;
  const conference = entry?.conferenceName;
  const record = entry
    ? `${entry.wins}-${entry.losses}-${entry.otLosses ?? 0}`
    : null;
  const seq = entry ? entry.divisionSequence : null;

  return (
    <header className="px-4 pt-10 pb-8 sm:pt-14 sm:pb-10">
      <div className="flex items-center gap-5 sm:gap-8">
        {/* Fluid hero logo: clamps so it never exceeds 40vw on small screens
            and never grows past 432 px on desktop. */}
        <TeamLogo
          code={code}
          size="min(40vw, 432px)"
          bare
          className="shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {name}
          </h1>
          {division ? (
            <p className="mt-2 text-xs text-(--text-muted) sm:text-sm">
              {division}
              {conference ? ` · ${conference}` : ""}
              {record ? ` · ${record}` : ""}
              {seq ? ` · #${seq} in division` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function Sections({ code, roster }: { code: string; roster: RosterResponse }) {
  return (
    <div className="space-y-3 px-4 py-4">
      <details open className="rounded-lg border border-(--border) bg-(--surface)">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Roster
        </summary>
        <div className="border-t border-(--border) p-3">
          <RosterTable title="Forwards" players={roster.forwards} />
          <RosterTable title="Defense" players={roster.defensemen} />
          <RosterTable title="Goalies" players={roster.goalies} />
        </div>
      </details>

      <ScheduleSection code={code} />
    </div>
  );
}

function ScheduleSection({ code }: { code: string }) {
  const query = useTeamSchedule(code);
  return (
    <details open className="rounded-lg border border-(--border) bg-(--surface)">
      <summary className="cursor-pointer px-4 py-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
        Schedule
      </summary>
      <div className="border-t border-(--border) p-3">
        <DataState
          isLoading={query.isLoading}
          error={query.error ?? null}
          hasData={Boolean(query.data)}
          skeleton={<Skeleton variant="row" count={6} />}
        >
          {query.data ? <ScheduleBody code={code} games={query.data.games} /> : null}
        </DataState>
      </div>
    </details>
  );
}

function ScheduleBody({ code, games }: { code: string; games: TeamScheduleGame[] }) {
  const today = todayUtc();
  // Filter to regular season + playoffs (drop preseason); split past vs future
  // by gameDate (YYYY-MM-DD lexicographic compare works).
  const real = games.filter((g) => g.gameType === 2 || g.gameType === 3);
  const past = real
    .filter((g) => g.gameDate < today)
    .sort((a, b) => b.gameDate.localeCompare(a.gameDate))
    .slice(0, 10);
  const upcoming = real
    .filter((g) => g.gameDate >= today)
    .sort((a, b) => a.gameDate.localeCompare(b.gameDate))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <ScheduleList title="Last 10 results" games={past} code={code} resultColumn />
      <ScheduleList title="Next 5 upcoming" games={upcoming} code={code} />
    </div>
  );
}

function ScheduleList({
  title,
  games,
  code,
  resultColumn = false,
}: {
  title: string;
  games: TeamScheduleGame[];
  code: string;
  resultColumn?: boolean;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-(--text-muted)">
        {title}
      </h3>
      {games.length === 0 ? (
        <p className="text-sm text-(--text-muted)">None.</p>
      ) : (
        <ul role="list" className="divide-y divide-(--border)">
          {games.map((g) => (
            <ScheduleRow key={g.id} game={g} code={code} resultColumn={resultColumn} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ScheduleRow({
  game,
  code,
  resultColumn,
}: {
  game: TeamScheduleGame;
  code: string;
  resultColumn: boolean;
}) {
  const isHome = game.homeTeam.abbrev === code;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const result = resultColumn ? outcomeFor(code, game) : null;

  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      <Link
        href={`/game/${game.id}`}
        className="flex flex-1 items-center gap-3 hover:underline"
      >
        <span className="w-20 shrink-0 text-xs tabular-nums text-(--text-muted)">
          {game.gameDate}
        </span>
        <span className="text-xs text-(--text-muted)">{isHome ? "vs" : "@"}</span>
        <TeamLogo code={opponent.abbrev} size={20} />
        <span className="font-medium">{opponent.abbrev}</span>
      </Link>
      <span className="ml-auto flex items-center gap-3">
        {result ? (
          <span
            className={`tabular-nums text-xs ${
              result.outcome === "W"
                ? "font-semibold text-(--accent)"
                : result.outcome === "L"
                  ? "text-(--text-muted)"
                  : "text-(--text-muted)"
            }`}
          >
            {result.outcome} {result.scoreFor}-{result.scoreAgainst}
          </span>
        ) : null}
        <GameStatePill
          state={game.gameState}
          period={game.periodDescriptor?.number}
          startTimeUTC={game.startTimeUTC}
        />
      </span>
    </li>
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
  // OT/SO loss when the game went past regulation and we lost.
  const lastPeriodType = game.gameOutcome?.lastPeriodType;
  let outcome: Outcome;
  if (our > their) outcome = "W";
  else if (our < their && (lastPeriodType === "OT" || lastPeriodType === "SO")) outcome = "OTL";
  else if (our < their) outcome = "L";
  else outcome = "—";
  return { outcome, scoreFor: our, scoreAgainst: their };
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function RosterTable({ title, players }: { title: string; players: RosterPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-(--text-muted)">
        {title}
      </h3>
      <table className="w-full text-sm">
        <thead className="text-xs text-(--text-muted)">
          <tr className="border-b border-(--border)">
            <th scope="col" className="w-10 py-1 text-left">#</th>
            <th scope="col" className="py-1 text-left">Player</th>
            <th scope="col" className="py-1 text-left">Pos</th>
            <th scope="col" className="hidden py-1 text-left md:table-cell">Shoots</th>
            <th scope="col" className="hidden py-1 text-right md:table-cell">Ht</th>
            <th scope="col" className="hidden py-1 text-right md:table-cell">Wt</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} className="border-b border-(--border) last:border-0 hover:bg-(--surface-hover)">
              <td className="py-1 tabular-nums text-(--text-muted)">{p.sweaterNumber ?? ""}</td>
              <td className="py-1">
                <Link href={`/player/${p.id}`} className="hover:underline">
                  {p.firstName.default} {p.lastName.default}
                </Link>
              </td>
              <td className="py-1">{p.positionCode}</td>
              <td className="hidden py-1 md:table-cell">{p.shootsCatches ?? "—"}</td>
              <td className="hidden py-1 text-right tabular-nums md:table-cell">
                {p.heightInInches ? formatHeight(p.heightInInches) : "—"}
              </td>
              <td className="hidden py-1 text-right tabular-nums md:table-cell">
                {p.weightInPounds ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatHeight(inches: number): string {
  const ft = Math.floor(inches / 12);
  const inchPart = inches % 12;
  return `${ft}'${inchPart}"`;
}
