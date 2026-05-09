import type { NextRequest } from 'next/server';
import { fetchStats, STATS_KINDS, type StatsKind, type StatsParams } from './fetcher';
import { isNhlApiError, type NhlApiError } from '../errors';

function statusForError(err: NhlApiError): number {
  switch (err.kind) {
    case 'http':
      return err.status;
    case 'schema':
      return 502;
    case 'network':
    case 'timeout':
      return 504;
  }
}

function isStatsKind(value: string): value is StatsKind {
  return (STATS_KINDS as readonly string[]).includes(value);
}

function parseIntParam(value: string | null): number | undefined {
  if (value === null) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');

  if (!kind || !isStatsKind(kind)) {
    return Response.json(
      {
        error: {
          kind: 'http',
          message: `kind must be one of: ${STATS_KINDS.join(', ')}`,
        },
      },
      { status: 400 },
    );
  }

  const params: StatsParams = {
    seasonId: parseIntParam(url.searchParams.get('seasonId')),
    gameTypeId: parseIntParam(url.searchParams.get('gameTypeId')),
    limit: parseIntParam(url.searchParams.get('limit')),
    sort: url.searchParams.get('sort') ?? undefined,
  };

  try {
    const data = await fetchStats(kind, params);
    return Response.json(data);
  } catch (err) {
    if (isNhlApiError(err)) {
      return Response.json(
        { error: { kind: err.kind, message: err.message } },
        { status: statusForError(err) },
      );
    }
    return Response.json(
      { error: { kind: 'network', message: 'Unknown error' } },
      { status: 500 },
    );
  }
}
