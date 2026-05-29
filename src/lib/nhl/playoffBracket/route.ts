import type { NextRequest } from 'next/server';
import { fetchPlayoffBracket } from './fetcher';
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

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/nhl/playoff-bracket/[year]'>,
) {
  const { year } = await ctx.params;
  const parsed = Number(year);
  if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2200) {
    return Response.json(
      { error: { kind: 'http', message: 'Invalid year' } },
      { status: 400 },
    );
  }

  try {
    const data = await fetchPlayoffBracket(parsed);
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
