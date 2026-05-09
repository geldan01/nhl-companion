import { describe, it, expect } from 'vitest';
import { PlayerResponse } from './schema';
import fixture from './__fixtures__/player.json';

describe('PlayerResponse schema', () => {
  it('parses the recorded NHL fixture without errors', () => {
    const result = PlayerResponse.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });
});
