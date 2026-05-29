import type { NextRequest } from 'next/server';
import { fetchRightRail } from './fetcher';
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
  req: NextRequest,
  ctx: RouteContext<'/api/nhl/game/[id]/right-rail'>,
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const state = url.searchParams.get('state') ?? undefined;

  try {
    const data = await fetchRightRail(id, state);
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
