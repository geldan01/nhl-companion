'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { StandingsResponse } from './schema';

async function fetchStandingsClient(): Promise<StandingsResponse> {
  const response = await fetch('/api/nhl/standings');
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

export function useStandings() {
  return useQuery<StandingsResponse, NhlApiError>({
    queryKey: ['nhl', 'standings'],
    queryFn: fetchStandingsClient,
    staleTime: STALE.standings,
    refetchInterval: usePollingInterval(POLL.standings),
  });
}
