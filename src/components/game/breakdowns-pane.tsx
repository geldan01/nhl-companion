"use client";

import { DataState } from "@/components/data-state";
import { GoalsBreakdown } from "@/components/game/goals-breakdown";
import { Skeleton } from "@/components/skeleton";
import { usePlayByPlay } from "@/lib/nhl/playByPlay";

export type BreakdownsPaneProps = {
  id: number;
};

export function BreakdownsPane({ id }: BreakdownsPaneProps) {
  const query = usePlayByPlay(id);
  return (
    <DataState
      isLoading={query.isLoading}
      error={query.error ?? null}
      hasData={Boolean(query.data)}
      skeleton={
        <div className="p-3">
          <Skeleton variant="row" count={6} />
        </div>
      }
    >
      {query.data ? <GoalsBreakdown response={query.data} /> : null}
    </DataState>
  );
}
