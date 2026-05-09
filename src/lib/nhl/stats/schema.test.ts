import { describe, it, expect } from 'vitest';
import { SkaterStatsResponse } from './schema.skater';
import { GoalieStatsResponse } from './schema.goalie';
import { TeamStatsResponse } from './schema.team';
import skaterFixture from './__fixtures__/skater.json';
import goalieFixture from './__fixtures__/goalie.json';
import teamFixture from './__fixtures__/team.json';

describe('stats schemas', () => {
  it('SkaterStatsResponse parses the recorded fixture', () => {
    const result = SkaterStatsResponse.safeParse(skaterFixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('GoalieStatsResponse parses the recorded fixture', () => {
    const result = GoalieStatsResponse.safeParse(goalieFixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('TeamStatsResponse parses the recorded fixture', () => {
    const result = TeamStatsResponse.safeParse(teamFixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });
});
