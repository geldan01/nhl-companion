import { describe, it, expect } from 'vitest';
import { derivePhase } from './season-phase';
import type { ScheduleNowResponse } from './scheduleNow';

// Minimal stand-in for a schedule game — derivePhase only reads gameType.
function game(gameType: number) {
  return { gameType } as ScheduleNowResponse['gameWeek'][number]['games'][number];
}

function schedule(days: number[][]): ScheduleNowResponse {
  return {
    gameWeek: days.map((types) => ({ games: types.map(game) })),
  } as ScheduleNowResponse;
}

describe('derivePhase', () => {
  it('returns null while data is absent', () => {
    expect(derivePhase(undefined)).toBeNull();
  });

  it('reports offseason when the week has no games', () => {
    expect(derivePhase(schedule([[], []]))).toBe('offseason');
  });

  it('reports playoffs when any game is gameType 3', () => {
    expect(derivePhase(schedule([[2], [3, 2]]))).toBe('playoffs');
  });

  it('reports regular season for preseason/regular games only', () => {
    expect(derivePhase(schedule([[1, 2], [2]]))).toBe('regular');
  });
});
