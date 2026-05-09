import { describe, it, expect } from 'vitest';
import { GameResponse } from './schema';
import fixture from './__fixtures__/game.json';

describe('GameResponse schema', () => {
  it('parses the recorded NHL fixture without errors', () => {
    const result = GameResponse.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });
});
