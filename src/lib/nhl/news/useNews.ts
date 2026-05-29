'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { NewsResponse } from './schema';

async function fetchNewsClient(limit: number): Promise<NewsResponse> {
  const response = await fetch(`/api/nhl/news?limit=${limit}`);
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

export function useNews(limit: number = 5) {
  return useQuery<NewsResponse, NhlApiError>({
    queryKey: ['nhl', 'news', limit],
    queryFn: () => fetchNewsClient(limit),
    staleTime: STALE.news,
    refetchInterval: usePollingInterval(POLL.news),
  });
}
