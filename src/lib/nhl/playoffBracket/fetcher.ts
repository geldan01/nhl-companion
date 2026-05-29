import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { PlayoffBracketResponse } from './schema';

export async function fetchPlayoffBracket(year: number): Promise<PlayoffBracketResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/playoff-bracket/${year}`,
    schema: PlayoffBracketResponse,
    revalidate: TTL.playoffBracket,
  });
}
