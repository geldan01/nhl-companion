import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { NewsResponse } from './schema';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 25;

export async function fetchNews(limit: number = DEFAULT_LIMIT): Promise<NewsResponse> {
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit)), MAX_LIMIT);
  return nhlFetch({
    url: `${HOSTS.forge}/v2/content/en-us/stories?context.slug=nhl&$limit=${safeLimit}`,
    schema: NewsResponse,
    revalidate: TTL.news,
  });
}
