import { describe, it, expect } from 'vitest';
import { RosterResponse } from './schema';
import fixture from './__fixtures__/roster.json';

describe('RosterResponse schema', () => {
  it('parses the recorded NHL fixture without errors', () => {
    const result = RosterResponse.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });
});
