import { describe, it, expect } from 'vitest';
import { ScheduleResponse } from './schema';
import fixture from './__fixtures__/schedule.json';

describe('ScheduleResponse schema', () => {
  it('parses the recorded NHL fixture without errors', () => {
    const result = ScheduleResponse.safeParse(fixture);
    if (!result.success) {
      console.error(JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });
});
