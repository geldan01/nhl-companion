import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { PlayerResponse } from './schema';

export async function fetchPlayer(id: string | number): Promise<PlayerResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/player/${id}/landing`,
    schema: PlayerResponse,
    revalidate: TTL.player,
  });
}
