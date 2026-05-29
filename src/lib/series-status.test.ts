import { describe, it, expect } from 'vitest';
import { seriesSummary } from './series-status';

describe('seriesSummary', () => {
  it('reports a decided series as a win for the team that reached neededToWin', () => {
    const s = seriesSummary({ abbrev: 'CAR', wins: 4 }, { abbrev: 'PHI', wins: 1 });
    expect(s.text).toBe('CAR wins 4–1');
    expect(s.leaderAbbrev).toBe('CAR');
    expect(s.decided).toBe(true);
  });

  it('reports the leader of an in-progress series', () => {
    const s = seriesSummary({ abbrev: 'MTL', wins: 3 }, { abbrev: 'BUF', wins: 2 });
    expect(s.text).toBe('MTL leads 3–2');
    expect(s.decided).toBe(false);
  });

  it('reports a tie', () => {
    const s = seriesSummary({ abbrev: 'COL', wins: 2 }, { abbrev: 'MIN', wins: 2 });
    expect(s.text).toBe('Series tied 2–2');
    expect(s.leaderAbbrev).toBeNull();
  });

  it('reports a not-yet-started series', () => {
    const s = seriesSummary({ abbrev: 'VGK', wins: 0 }, { abbrev: 'TBD', wins: 0 });
    expect(s.text).toBe('Series not started');
  });

  it('honors a custom neededToWin (best-of-5 play-in)', () => {
    const s = seriesSummary({ abbrev: 'A', wins: 3 }, { abbrev: 'B', wins: 0 }, 3);
    expect(s.decided).toBe(true);
    expect(s.text).toBe('A wins 3–0');
  });
});
