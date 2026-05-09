'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { StatsKind, StatsParams, StatsResponseFor } from './fetcher';

async function fetchStatsClient<K extends StatsKind>(
  kind: K,
  params: StatsParams,
): Promise<StatsResponseFor<K>> {
  const url = new URL('/api/nhl/stats', window.location.origin);
  url.searchParams.set('kind', kind);
  if (params.seasonId !== undefined) url.searchParams.set('seasonId', String(params.seasonId));
  if (params.gameTypeId !== undefined) url.searchParams.set('gameTypeId', String(params.gameTypeId));
  if (params.limit !== undefined) url.searchParams.set('limit', String(params.limit));
  if (params.sort !== undefined) url.searchParams.set('sort', params.sort);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw (
      body?.error ??
      ({
        kind: 'http',
        status: response.status,
        url: response.url,
        message: `Request failed with ${response.status}`,
      } satisfies NhlApiError)
    );
  }
  return response.json();
}

function useStats<K extends StatsKind>(kind: K, params: StatsParams = {}) {
  return useQuery<StatsResponseFor<K>, NhlApiError>({
    queryKey: ['nhl', 'stats', kind, params],
    queryFn: () => fetchStatsClient(kind, params),
    staleTime: STALE.stats,
    refetchInterval: usePollingInterval(POLL.stats),
  });
}

// NHL stats API needs a JSON-encoded sort spec for descending order.
// A bare property name like `sort=points` defaults to ascending — useless for
// "top N" leaderboards. Hooks default to descending; pass `sort` to override.
function descSort(property: string): string {
  return JSON.stringify([{ property, direction: 'DESC' }]);
}

export function useSkaterStats(params: StatsParams = {}) {
  return useStats('skater', { sort: descSort('points'), ...params });
}

export function useGoalieStats(params: StatsParams = {}) {
  return useStats('goalie', { sort: descSort('wins'), ...params });
}

export function useTeamStats(params: StatsParams = {}) {
  return useStats('team', { sort: descSort('points'), ...params });
}
