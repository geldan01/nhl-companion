'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { RosterResponse } from './schema';

async function fetchRosterClient(code: string): Promise<RosterResponse> {
  const response = await fetch(`/api/nhl/team/${code.toUpperCase()}/roster`);
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

export function useRoster(code: string) {
  return useQuery<RosterResponse, NhlApiError>({
    queryKey: ['nhl', 'roster', code.toUpperCase()],
    queryFn: () => fetchRosterClient(code),
    staleTime: STALE.roster,
    refetchInterval: usePollingInterval(POLL.roster),
  });
}
