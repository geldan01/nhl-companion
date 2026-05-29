"use client";

import Link from "next/link";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { useSeasonPhase } from "@/lib/nhl/season-phase";
import { usePlayoffBracket } from "@/lib/nhl/playoffBracket";
import { useStandings } from "@/lib/nhl/standings";
import { HomeBracket } from "./home-bracket";
import { DivisionStandings } from "./division-standings";
import { OffseasonMessage } from "./offseason-message";

// Picks the headline module based on where the league is in its calendar.
// The per-phase content lives in child components so each data hook
// (bracket / standings) only fires for the phase actually on screen.
export function SeasonModule() {
  const { phase, query } = useSeasonPhase();

  return (
    <DataState
      isLoading={query.isLoading && !phase}
      error={query.error ?? null}
      hasData={Boolean(phase)}
      skeleton={<Skeleton variant="card" count={3} />}
    >
      {phase === "playoffs" ? <PlayoffsModule /> : null}
      {phase === "regular" ? <RegularModule /> : null}
      {phase === "offseason" ? <OffseasonMessage /> : null}
    </DataState>
  );
}

function ModuleHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <Link href={href} className="text-xs font-medium text-(--accent) hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}

function PlayoffsModule() {
  const query = usePlayoffBracket();
  return (
    <div>
      <ModuleHeader title="Playoff Bracket" href="/playoffs" linkLabel="Full bracket" />
      <DataState
        isLoading={query.isLoading}
        error={query.error ?? null}
        hasData={Boolean(query.data)}
        skeleton={<Skeleton variant="card" count={2} />}
        emptyState={
          <p className="px-4 py-8 text-center text-sm text-(--text-muted)">
            No playoff bracket available yet.
          </p>
        }
      >
        {query.data ? <HomeBracket series={query.data.series} /> : null}
      </DataState>
    </div>
  );
}

function RegularModule() {
  const query = useStandings();
  return (
    <div>
      <ModuleHeader title="Standings by Division" href="/standings" linkLabel="Full standings" />
      <DataState
        isLoading={query.isLoading}
        error={query.error ?? null}
        hasData={Boolean(query.data)}
        skeleton={<Skeleton variant="card" count={4} />}
      >
        {query.data ? <DivisionStandings standings={query.data.standings} /> : null}
      </DataState>
    </div>
  );
}
