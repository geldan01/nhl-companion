import { describe, it, expect } from 'vitest';
import { TeamResponse } from './schema';
import fixture from './__fixtures__/team.json';

describe('TeamResponse schema', () => {
  it('parses the recorded NHL fixture without errors', () => {
    const result = TeamResponse.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });
});
