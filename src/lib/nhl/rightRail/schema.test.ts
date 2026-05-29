import { describe, it, expect } from 'vitest';
import { RightRailResponse } from './schema';
import fixture from './__fixtures__/rightRail.json';

describe('RightRailResponse schema', () => {
  it('parses the recorded NHL fixture without errors', () => {
    const result = RightRailResponse.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('exposes the playoff series wins block', () => {
    const parsed = RightRailResponse.parse(fixture);
    expect(parsed.seasonSeriesWins?.neededToWin).toBe(4);
    expect(parsed.seasonSeriesWins?.homeTeamWins).toBe(4);
    expect(parsed.seasonSeriesWins?.awayTeamWins).toBe(0);
  });
});
