import { describe, it, expect } from 'vitest';
import { BoxscoreResponse } from './schema';
import fixture from './__fixtures__/boxscore.json';

describe('BoxscoreResponse schema', () => {
  it('parses the recorded NHL fixture without errors', () => {
    const result = BoxscoreResponse.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });
});
