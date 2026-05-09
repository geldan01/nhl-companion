import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { nhlFetch } from './fetcher';

const URL = 'https://api-web.nhle.com/v1/test';
const Schema = z.object({ name: z.string() });

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchResponse(body: unknown, init: { status?: number; statusText?: string } = {}) {
  const status = init.status ?? 200;
  vi.mocked(globalThis.fetch).mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      statusText: init.statusText,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('nhlFetch', () => {
  it('parses a successful response with the supplied schema', async () => {
    mockFetchResponse({ name: 'Bruins' });
    const result = await nhlFetch({ url: URL, schema: Schema });
    expect(result).toEqual({ name: 'Bruins' });
  });

  it('passes Accept and User-Agent headers, plus the cache directive', async () => {
    mockFetchResponse({ name: 'x' });
    await nhlFetch({ url: URL, schema: Schema, revalidate: 60 });

    const call = vi.mocked(globalThis.fetch).mock.calls[0];
    const init = call[1] as RequestInit & { next?: { revalidate?: number } };
    const headers = init.headers as Record<string, string>;
    expect(headers.Accept).toBe('application/json');
    expect(headers['User-Agent']).toContain('nhl-companion');
    expect(init.next).toEqual({ revalidate: 60 });
  });

  it('passes cache: no-store when revalidate is false', async () => {
    mockFetchResponse({ name: 'x' });
    await nhlFetch({ url: URL, schema: Schema, revalidate: false });

    const init = vi.mocked(globalThis.fetch).mock.calls[0][1] as RequestInit;
    expect(init.cache).toBe('no-store');
  });

  it('maps HTTP 500 to NhlApiError kind: http', async () => {
    mockFetchResponse({}, { status: 500, statusText: 'Internal Server Error' });
    await expect(nhlFetch({ url: URL, schema: Schema })).rejects.toMatchObject({
      kind: 'http',
      status: 500,
      url: URL,
    });
  });

  it('maps HTTP 404 to NhlApiError kind: http with status 404', async () => {
    mockFetchResponse({}, { status: 404, statusText: 'Not Found' });
    await expect(nhlFetch({ url: URL, schema: Schema })).rejects.toMatchObject({
      kind: 'http',
      status: 404,
    });
  });

  it('maps a network throw to NhlApiError kind: network', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(nhlFetch({ url: URL, schema: Schema })).rejects.toMatchObject({
      kind: 'network',
      url: URL,
    });
  });

  it('maps an AbortError (timeout) to NhlApiError kind: timeout', async () => {
    vi.mocked(globalThis.fetch).mockImplementationOnce(async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    });
    await expect(nhlFetch({ url: URL, schema: Schema })).rejects.toMatchObject({
      kind: 'timeout',
      url: URL,
    });
  });

  it('maps a Zod parse failure to NhlApiError kind: schema with issues', async () => {
    mockFetchResponse({ name: 42 }); // wrong type
    const promise = nhlFetch({ url: URL, schema: Schema });
    await expect(promise).rejects.toMatchObject({ kind: 'schema', url: URL });
    await promise.catch((err) => {
      expect(Array.isArray(err.issues)).toBe(true);
      expect(err.issues.length).toBeGreaterThan(0);
    });
  });
});
