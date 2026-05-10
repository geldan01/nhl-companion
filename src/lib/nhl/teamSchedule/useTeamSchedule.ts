'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { TeamScheduleResponse } from './schema';

async function fetchTeamScheduleClient(code: string): Promise<TeamScheduleResponse> {
  const response = await fetch(`/api/nhl/team/${code.toUpperCase()}/schedule`);
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

export function useTeamSchedule(code: string) {
  return useQuery<TeamScheduleResponse, NhlApiError>({
    queryKey: ['nhl', 'teamSchedule', code.toUpperCase()],
    queryFn: () => fetchTeamScheduleClient(code),
    staleTime: STALE.teamSchedule,
    refetchInterval: usePollingInterval(POLL.teamSchedule),
  });
}
