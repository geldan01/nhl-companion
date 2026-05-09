// Tests the live/final polling-cadence flip across the three live-game hooks.
// Each hook exports a pure `<thing>PollMs(state, visible)` helper so the cadence
// rule is directly testable without mocking React Query or jsdom timers.

import { describe, it, expect } from 'vitest';
import { gamePollMs } from './game/useGame';
import { playByPlayPollMs } from './playByPlay/usePlayByPlay';
import { boxscorePollMs } from './boxscore/useBoxscore';

describe('cadence flip — game / playByPlay / boxscore', () => {
  it('polls at the live cadence when state is LIVE and tab is visible', () => {
    expect(gamePollMs('LIVE', true)).toBe(5_000);
    expect(playByPlayPollMs('LIVE', true)).toBe(5_000);
    expect(boxscorePollMs('LIVE', true)).toBe(10_000);
  });

  it('polls at the live cadence when state is CRIT (close late-period)', () => {
    expect(gamePollMs('CRIT', true)).toBe(5_000);
    expect(playByPlayPollMs('CRIT', true)).toBe(5_000);
    expect(boxscorePollMs('CRIT', true)).toBe(10_000);
  });

  it('stops polling when game is FINAL or OFF', () => {
    for (const state of ['FINAL', 'OFF']) {
      expect(gamePollMs(state, true)).toBe(false);
      expect(playByPlayPollMs(state, true)).toBe(false);
      expect(boxscorePollMs(state, true)).toBe(false);
    }
  });

  it('stops polling for FUT/PRE games (not yet started)', () => {
    for (const state of ['FUT', 'PRE']) {
      expect(gamePollMs(state, true)).toBe(false);
      expect(playByPlayPollMs(state, true)).toBe(false);
      expect(boxscorePollMs(state, true)).toBe(false);
    }
  });

  it('stops polling when document is hidden — even for a live game', () => {
    expect(gamePollMs('LIVE', false)).toBe(false);
    expect(playByPlayPollMs('LIVE', false)).toBe(false);
    expect(boxscorePollMs('LIVE', false)).toBe(false);
  });

  it('stops polling when state is undefined (initial render before first response)', () => {
    expect(gamePollMs(undefined, true)).toBe(false);
    expect(playByPlayPollMs(undefined, true)).toBe(false);
    expect(boxscorePollMs(undefined, true)).toBe(false);
  });
});
