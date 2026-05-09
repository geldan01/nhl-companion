import type { NextRequest } from 'next/server';
import { fetchPlayer } from './fetcher';
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
  ctx: RouteContext<'/api/nhl/player/[id]'>,
) {
  const { id } = await ctx.params;

  if (!/^\d+$/.test(id)) {
    return Response.json(
      { error: { kind: 'http', message: 'Player id must be numeric' } },
      { status: 400 },
    );
  }

  try {
    const data = await fetchPlayer(id);
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
