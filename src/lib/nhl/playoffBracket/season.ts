// The playoff-bracket endpoint is keyed by the season's *end* year (e.g. the
// 2025-26 season's bracket lives at /v1/playoff-bracket/2026). An NHL season
// spans two calendar years and the playoffs always land in the back half, so
// the end year is "next year" once the new season opens (July onward) and the
// current year through the spring playoffs.
export function currentPlayoffYear(now: Date = new Date()): number {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12
  return month >= 7 ? year + 1 : year;
}
