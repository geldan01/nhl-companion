'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { ScheduleNowResponse } from './schema';

async function fetchScheduleNowClient(): Promise<ScheduleNowResponse> {
  const response = await fetch('/api/nhl/schedule-now');
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

export function useScheduleNow() {
  return useQuery<ScheduleNowResponse, NhlApiError>({
    queryKey: ['nhl', 'scheduleNow'],
    queryFn: fetchScheduleNowClient,
    staleTime: STALE.scheduleNow,
    refetchInterval: usePollingInterval(POLL.scheduleNow),
  });
}
