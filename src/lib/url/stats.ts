import { STATS_KINDS, type StatsKind } from "@/lib/nhl/stats";

export const DEFAULT_STATS_KIND: StatsKind = "skater";

export function parseStatsKind(value: string | null): StatsKind {
  return (STATS_KINDS as readonly string[]).includes(value ?? "")
    ? (value as StatsKind)
    : DEFAULT_STATS_KIND;
}

// Returns null when the kind is the default — callers omit `?kind=` from the
// URL in that case so the canonical URL stays clean.
export function formatStatsKind(kind: StatsKind): string | null {
  return kind === DEFAULT_STATS_KIND ? null : kind;
}
