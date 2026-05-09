'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { TeamResponse } from './schema';

async function fetchTeamClient(code: string): Promise<TeamResponse> {
  const response = await fetch(`/api/nhl/team/${code.toUpperCase()}`);
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

export function useTeam(code: string) {
  return useQuery<TeamResponse, NhlApiError>({
    queryKey: ['nhl', 'team', code.toUpperCase()],
    queryFn: () => fetchTeamClient(code),
    staleTime: STALE.team,
    refetchInterval: usePollingInterval(POLL.team),
  });
}
