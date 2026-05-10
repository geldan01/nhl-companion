import type { NextRequest } from 'next/server';
import { fetchTeamSchedule } from './fetcher';
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
  ctx: RouteContext<'/api/nhl/team/[code]/schedule'>,
) {
  const { code } = await ctx.params;

  try {
    const data = await fetchTeamSchedule(code);
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
