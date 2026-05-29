"use client";

import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import type { StandingEntry } from "@/lib/nhl/standings";

// Division standings grid for the homepage's regular-season module. Four
// divisions, each a compact table sorted by the league's own division ranking.
export function DivisionStandings({ standings }: { standings: StandingEntry[] }) {
  const byDivision = groupByDivision(standings);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {byDivision.map(({ division, teams }) => (
        <section key={division} className="rounded-lg border border-(--border) bg-(--surface)">
          <h3 className="border-b border-(--border) px-3 py-2 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
            {division}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-(--text-muted)">
                <th className="px-3 py-1.5 text-left font-medium">Team</th>
                <th className="px-2 py-1.5 text-right font-medium">GP</th>
                <th className="px-3 py-1.5 text-right font-medium">PTS</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((entry, i) => (
                <tr
                  key={entry.teamAbbrev.default}
                  className="border-t border-(--border) transition-colors hover:bg-(--surface-hover)"
                >
                  <td className="px-3 py-1.5">
                    <Link
                      href={`/team/${entry.teamAbbrev.default}`}
                      className="flex items-center gap-2"
                    >
                      <span className="w-4 shrink-0 text-right text-xs tabular-nums text-(--text-muted)">
                        {i + 1}
                      </span>
                      <TeamLogo code={entry.teamAbbrev.default} size={20} />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {entry.teamCommonName.default}
                      </span>
                    </Link>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-(--text-muted)">
                    {entry.gamesPlayed}
                  </td>
                  <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                    {entry.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

function groupByDivision(standings: StandingEntry[]) {
  const map = new Map<string, StandingEntry[]>();
  for (const entry of standings) {
    const list = map.get(entry.divisionName) ?? [];
    list.push(entry);
    map.set(entry.divisionName, list);
  }
  return [...map.entries()]
    .map(([division, teams]) => ({
      division,
      teams: teams.sort((a, b) => a.divisionSequence - b.divisionSequence),
    }))
    .sort((a, b) => a.division.localeCompare(b.division));
}
