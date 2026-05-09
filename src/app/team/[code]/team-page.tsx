"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { TeamLogo } from "@/components/team-logo";
import type { RosterPlayer, RosterResponse } from "@/lib/nhl/roster";
import { useRoster } from "@/lib/nhl/roster";
import type { StandingEntry, StandingsResponse } from "@/lib/nhl/standings";
import { getTeamColors, type TeamCode } from "@/lib/team-colors";

const STANDINGS_QUERY_KEY = ["nhl", "standings"] as const;

export function TeamPage({ code }: { code: string }) {
  const roster = useRoster(code);

  // Opportunistic peek at the standings cache. Don't subscribe (no fetch on
  // demand for this page) — just read whatever's there from a prior visit to
  // /standings. Falls back gracefully when the cache is empty.
  const queryClient = useQueryClient();
  const cachedStandings = queryClient.getQueryData<StandingsResponse>(
    STANDINGS_QUERY_KEY,
  );
  const entry = cachedStandings?.standings.find(
    (s) => s.teamAbbrev.default === code,
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Header code={code} entry={entry} />
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
        {roster.data ? <Sections roster={roster.data} /> : null}
      </DataState>
    </div>
  );
}

function Header({ code, entry }: { code: string; entry: StandingEntry | undefined }) {
  const { primary } = getTeamColors(code as TeamCode);
  const name = entry?.teamCommonName.default ?? code;
  const place = entry?.placeName.default;
  const division = entry?.divisionName;
  const conference = entry?.conferenceName;
  const record = entry
    ? `${entry.wins}-${entry.losses}-${entry.otLosses ?? 0}`
    : null;
  const seq = entry ? entry.divisionSequence : null;

  return (
    <header
      className="relative overflow-hidden border-b border-(--border)"
      style={{ background: `linear-gradient(180deg, ${primary}30, transparent)` }}
    >
      <div className="flex items-center gap-4 px-4 py-6">
        <TeamLogo code={code} size={72} />
        <div className="min-w-0">
          {place ? (
            <p className="text-xs uppercase tracking-wide text-(--text-muted)">
              {place}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          {division ? (
            <p className="text-xs text-(--text-muted)">
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

function Sections({ roster }: { roster: RosterResponse }) {
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

      <details className="rounded-lg border border-(--border) bg-(--surface)">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Recent results
        </summary>
        <div className="border-t border-(--border) px-4 py-6 text-sm text-(--text-muted)">
          Schedule history isn&apos;t wired yet — needs a{" "}
          <code className="rounded bg-(--surface-hover) px-1">useTeamSchedule</code>{" "}
          hook (future spec).
        </div>
      </details>
    </div>
  );
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
