import { describe, it, expect } from 'vitest';
import { PlayoffBracketResponse, isTbdTeam } from './schema';
import { currentPlayoffYear } from './season';
import fixture from './__fixtures__/playoffBracket.json';

describe('PlayoffBracketResponse schema', () => {
  it('parses the recorded NHL fixture without errors', () => {
    const result = PlayoffBracketResponse.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('flags the TBD placeholder team in the Stanley Cup Final slot', () => {
    const parsed = PlayoffBracketResponse.parse(fixture);
    const tbd = parsed.series
      .flatMap((s) => [s.topSeedTeam, s.bottomSeedTeam])
      .find((t) => t.abbrev === 'TBD');
    expect(tbd).toBeDefined();
    expect(isTbdTeam(tbd!)).toBe(true);
  });
});

describe('currentPlayoffYear', () => {
  it('returns the season end year during spring playoffs', () => {
    expect(currentPlayoffYear(new Date('2026-05-29T00:00:00Z'))).toBe(2026);
  });

  it('rolls to next year once the new season opens (July onward)', () => {
    expect(currentPlayoffYear(new Date('2025-10-08T00:00:00Z'))).toBe(2026);
    expect(currentPlayoffYear(new Date('2025-07-01T00:00:00Z'))).toBe(2026);
  });
});
