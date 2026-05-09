import { z, ZodError } from 'zod';
import { toNhlApiError, type NhlApiError } from './errors';

const DEFAULT_TIMEOUT_MS = 5000;
const USER_AGENT = 'nhl-companion/0.1';

export type NhlFetchOpts<T> = {
  url: string;
  schema: z.ZodType<T>;
  revalidate?: number | false;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function nhlFetch<T>(opts: NhlFetchOpts<T>): Promise<T> {
  const { url, schema, revalidate, signal: externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const cacheOpts: RequestInit & { next?: { revalidate?: number } } =
    revalidate === false
      ? { cache: 'no-store' }
      : revalidate !== undefined
        ? { next: { revalidate } }
        : {};

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
      ...cacheOpts,
    });

    if (!response.ok) {
      const httpErr: NhlApiError = {
        kind: 'http',
        status: response.status,
        url,
        message: `Upstream returned ${response.status} ${response.statusText}`,
      };
      throw httpErr;
    }

    const json = await response.json();

    try {
      return schema.parse(json);
    } catch (err) {
      if (err instanceof ZodError) {
        const schemaErr: NhlApiError = {
          kind: 'schema',
          issues: err.issues,
          url,
          message: `Response from ${url} did not match schema`,
        };
        throw schemaErr;
      }
      throw err;
    }
  } catch (err) {
    throw toNhlApiError(err, url);
  } finally {
    clearTimeout(timeoutId);
  }
}
