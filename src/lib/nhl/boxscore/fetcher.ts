import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL, type GameStateInput } from '../cache';
import { BoxscoreResponse } from './schema';

export async function fetchBoxscore(
  id: string | number,
  state?: GameStateInput,
): Promise<BoxscoreResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/gamecenter/${id}/boxscore`,
    schema: BoxscoreResponse,
    revalidate: TTL.boxscore(state ?? 'LIVE'),
  });
}
