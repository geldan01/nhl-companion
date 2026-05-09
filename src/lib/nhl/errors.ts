import type { ZodIssue } from 'zod';

export type NhlApiError =
  | { kind: 'http'; status: number; url: string; message: string }
  | { kind: 'network'; cause: unknown; url: string; message: string }
  | { kind: 'schema'; issues: ZodIssue[]; url: string; message: string }
  | { kind: 'timeout'; url: string; message: string };

export function toNhlApiError(error: unknown, url: string): NhlApiError {
  if (isNhlApiError(error)) return error;

  if (error instanceof Error && error.name === 'AbortError') {
    return { kind: 'timeout', url, message: `Request to ${url} timed out` };
  }

  return {
    kind: 'network',
    cause: error,
    url,
    message: error instanceof Error ? error.message : 'Unknown network error',
  };
}

export function isNhlApiError(value: unknown): value is NhlApiError {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { kind?: unknown };
  return (
    v.kind === 'http' ||
    v.kind === 'network' ||
    v.kind === 'schema' ||
    v.kind === 'timeout'
  );
}
