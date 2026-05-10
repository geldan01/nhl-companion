"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { TeamLogo } from "@/components/team-logo";
import type { StandingEntry } from "@/lib/nhl/standings";
import { useStandings } from "@/lib/nhl/standings";

type View = "division" | "wildcard";

const DIVISIONS = ["Atlantic", "Metropolitan", "Central", "Pacific"] as const;
const CONFERENCES = ["Eastern", "Western"] as const;

export function StandingsView() {
  const query = useStandings();
  const router = useRouter();
  const params = useSearchParams();
  const view: View = params.get("view") === "wildcard" ? "wildcard" : "division";

  const setView = (next: View) => {
    const sp = new URLSearchParams(params);
    if (next === "division") sp.delete("view");
    else sp.set("view", next);
    const qs = sp.toString();
    router.replace(qs ? `/standings?${qs}` : "/standings");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Standings</h1>
        <SegmentedControl view={view} onChange={setView} />
      </header>
      <DataState
        isLoading={query.isLoading}
        error={query.error ?? null}
        hasData={Boolean(query.data)}
        skeleton={<Skeleton variant="card" count={4} />}
      >
        {query.data ? <Cards entries={query.data.standings} view={view} /> : null}
      </DataState>
    </div>
  );
}

function SegmentedControl({
  view,
  onChange,
}: {
  view: View;
  onChange: (next: View) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-(--border) bg-(--surface) p-0.5 text-xs">
      {(["division", "wildcard"] as const).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-full px-3 py-1 capitalize transition-colors ${
            view === key
              ? "bg-(--bg) text-(--text) shadow-sm"
              : "text-(--text-muted)"
          }`}
        >
          {key === "division" ? "Division" : "Wild Card"}
        </button>
      ))}
    </div>
  );
}

function Cards({ entries, view }: { entries: StandingEntry[]; view: View }) {
  if (view === "division") {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {DIVISIONS.map((name) => {
          const inDivision = entries
            .filter((e) => e.divisionName === name)
            .sort((a, b) => a.divisionSequence - b.divisionSequence);
          if (inDivision.length === 0) return null;
          return (
            <StandingsCard
              key={name}
              title={name}
              rows={inDivision}
              playoffLine={3}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {CONFERENCES.map((name) => {
        const inConference = entries
          .filter((e) => e.conferenceName === name)
          .sort((a, b) => a.conferenceSequence - b.conferenceSequence);
        if (inConference.length === 0) return null;
        return (
          <StandingsCard
            key={name}
            title={name}
            rows={inConference}
            playoffLine={8}
          />
        );
      })}
    </div>
  );
}

function StandingsCard({
  title,
  rows,
  playoffLine,
}: {
  title: string;
  rows: StandingEntry[];
  playoffLine: number;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-(--border) bg-(--surface)">
      <h2 className="border-b border-(--border) px-4 py-2 text-sm font-semibold tracking-tight">
        {title}
      </h2>
      <table className="w-full text-sm">
        <thead className="text-xs text-(--text-muted)">
          <tr className="border-b border-(--border)">
            <th scope="col" className="w-8 px-2 py-2 text-left">#</th>
            <th scope="col" className="px-2 py-2 text-left">Team</th>
            <th scope="col" className="px-2 py-2 text-right">GP</th>
            <th scope="col" className="hidden px-2 py-2 text-right md:table-cell">W</th>
            <th scope="col" className="hidden px-2 py-2 text-right md:table-cell">L</th>
            <th scope="col" className="hidden px-2 py-2 text-right md:table-cell">OTL</th>
            <th scope="col" className="px-2 py-2 text-right">PTS</th>
            <th scope="col" className="hidden px-2 py-2 text-right lg:table-cell">P%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, i) => (
            <tr
              key={entry.teamAbbrev.default}
              aria-label={i + 1 === playoffLine ? "Last playoff position" : undefined}
              className={`hover:bg-(--surface-hover) ${
                i + 1 === playoffLine
                  ? "border-b-[3px] border-dashed border-(--accent)"
                  : "border-b border-(--border)"
              }`}
            >
              <td className="px-2 py-2 tabular-nums text-(--text-muted)">{i + 1}</td>
              <td className="px-2 py-2">
                <Link
                  href={`/team/${entry.teamAbbrev.default}`}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <TeamLogo code={entry.teamAbbrev.default} size={20} />
                  <span className="font-medium">{entry.teamAbbrev.default}</span>
                  <span className="text-(--text-muted)">{entry.teamCommonName.default}</span>
                </Link>
              </td>
              <td className="px-2 py-2 text-right tabular-nums">{entry.gamesPlayed}</td>
              <td className="hidden px-2 py-2 text-right tabular-nums md:table-cell">{entry.wins}</td>
              <td className="hidden px-2 py-2 text-right tabular-nums md:table-cell">{entry.losses}</td>
              <td className="hidden px-2 py-2 text-right tabular-nums md:table-cell">{entry.otLosses ?? "-"}</td>
              <td className="px-2 py-2 text-right font-semibold tabular-nums">{entry.points}</td>
              <td className="hidden px-2 py-2 text-right tabular-nums lg:table-cell">
                {entry.pointPctg ? entry.pointPctg.toFixed(3) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
