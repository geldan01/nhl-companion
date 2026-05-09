import { describe, it, expect } from 'vitest';
import { PlayByPlayResponse } from './schema';
import fixture from './__fixtures__/playByPlay.json';

describe('PlayByPlayResponse schema', () => {
  it('parses the recorded NHL fixture without errors', () => {
    const result = PlayByPlayResponse.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('captures shot coordinates and home defending side', () => {
    const data = PlayByPlayResponse.parse(fixture);
    const goal = data.plays.find((p) => p.typeDescKey === 'goal');
    expect(goal).toBeDefined();
    expect(typeof goal?.details?.xCoord).toBe('number');
    expect(typeof goal?.details?.yCoord).toBe('number');
    expect(['left', 'right']).toContain(goal?.homeTeamDefendingSide);
  });
});
