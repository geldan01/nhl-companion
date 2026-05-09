import { describe, it, expect } from 'vitest';
import { TTL, STALE, POLL, isLiveGameState, isTodayUtc } from './cache';

describe('isLiveGameState', () => {
  it('treats LIVE and CRIT as live', () => {
    expect(isLiveGameState('LIVE')).toBe(true);
    expect(isLiveGameState('CRIT')).toBe(true);
  });

  it('treats other states (and missing state) as not live', () => {
    expect(isLiveGameState('FINAL')).toBe(false);
    expect(isLiveGameState('OFF')).toBe(false);
    expect(isLiveGameState('FUT')).toBe(false);
    expect(isLiveGameState('PRE')).toBe(false);
    expect(isLiveGameState(undefined)).toBe(false);
    expect(isLiveGameState(null)).toBe(false);
  });
});

describe('TTL/STALE/POLL — game live/final flip', () => {
  it('lives → no-store / 0 stale / 5s poll', () => {
    expect(TTL.game('LIVE')).toBe(false);
    expect(STALE.game('LIVE')).toBe(0);
    expect(POLL.game('LIVE')).toBe(5_000);
  });

  it('finals → 1h server / 5min stale / no poll', () => {
    expect(TTL.game('FINAL')).toBe(60 * 60);
    expect(STALE.game('FINAL')).toBe(5 * 60_000);
    expect(POLL.game('FINAL')).toBe(false);
  });

  it('boxscore polls slower than game (10s vs 5s) when live', () => {
    expect(POLL.boxscore('LIVE')).toBe(10_000);
    expect(POLL.game('LIVE')).toBe(5_000);
  });
});

describe('TTL/STALE/POLL — schedule today vs other dates', () => {
  const today = new Date().toISOString().slice(0, 10);
  const other = '1999-01-01';

  it('flags todayUtc correctly', () => {
    expect(isTodayUtc(today)).toBe(true);
    expect(isTodayUtc(other)).toBe(false);
  });

  it('today → 60s server / 30s stale / 60s poll', () => {
    expect(TTL.schedule(today)).toBe(60);
    expect(STALE.schedule(today)).toBe(30_000);
    expect(POLL.schedule(today)).toBe(60_000);
  });

  it('other date → 1h server / 1h stale / no poll', () => {
    expect(TTL.schedule(other)).toBe(60 * 60);
    expect(STALE.schedule(other)).toBe(60 * 60_000);
    expect(POLL.schedule(other)).toBe(false);
  });
});
