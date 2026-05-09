import { z, ZodError } from 'zod';
import { toNhlApiError, type NhlApiError } from './errors';
import { isFixturesMode, tryFixtureFor } from './fixtures-mode';

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

  if (isFixturesMode()) {
    const fixture = tryFixtureFor(url);
    if (fixture !== null) {
      // Still parse — fixtures should match the schema, and a regression here
      // is exactly what the e2e suite catches if the API shape changes.
      try {
        return schema.parse(fixture);
      } catch (err) {
        if (err instanceof ZodError) {
          const schemaErr: NhlApiError = {
            kind: 'schema',
            issues: err.issues,
            url,
            message: `Fixture for ${url} did not match schema`,
          };
          throw schemaErr;
        }
        throw err;
      }
    }
    // Fall through to a real upstream fetch when the URL has no fixture —
    // useful for one-off probes during e2e dev. The Playwright config can
    // also be set up to fail loudly if real network is hit.
  }

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
