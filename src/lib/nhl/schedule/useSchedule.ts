'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { ScheduleResponse } from './schema';

async function fetchScheduleClient(date: string): Promise<ScheduleResponse> {
  const response = await fetch(`/api/nhl/schedule/${date}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err: NhlApiError = body?.error ?? {
      kind: 'http',
      status: response.status,
      url: response.url,
      message: `Request failed with ${response.status}`,
    };
    throw err;
  }
  return response.json();
}

export function useSchedule(date: string) {
  return useQuery<ScheduleResponse, NhlApiError>({
    queryKey: ['nhl', 'schedule', date],
    queryFn: () => fetchScheduleClient(date),
    staleTime: STALE.schedule(date),
    refetchInterval: usePollingInterval(POLL.schedule(date)),
  });
}
