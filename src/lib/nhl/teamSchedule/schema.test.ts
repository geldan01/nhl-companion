import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/teamSchedule.json';
import { TeamScheduleResponse } from './schema';

describe('TeamScheduleResponse schema', () => {
  it('parses the recorded /v1/club-schedule-season/BOS/now fixture', () => {
    const parsed = TeamScheduleResponse.parse(fixture);
    expect(parsed.currentSeason).toBe(20252026);
    expect(parsed.games.length).toBeGreaterThan(0);
    // Spot-check the shape of the first game.
    const first = parsed.games[0];
    expect(first.id).toBeTypeOf('number');
    expect(first.gameDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(first.awayTeam.abbrev).toBeTypeOf('string');
    expect(first.homeTeam.abbrev).toBeTypeOf('string');
  });
});
