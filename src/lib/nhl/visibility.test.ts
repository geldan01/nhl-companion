import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisibility, usePollingInterval } from './visibility';

function setVisibility(value: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    value,
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  setVisibility('visible');
});

describe('useVisibility', () => {
  it('returns true when document is visible', () => {
    const { result } = renderHook(() => useVisibility());
    expect(result.current).toBe(true);
  });

  it('flips to false when visibilitychange fires with hidden', () => {
    const { result } = renderHook(() => useVisibility());
    act(() => {
      setVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(false);
  });
});

describe('usePollingInterval', () => {
  it('returns the supplied ms when visible', () => {
    const { result } = renderHook(() => usePollingInterval(5000));
    expect(result.current).toBe(5000);
  });

  it('returns false when document becomes hidden', () => {
    const { result } = renderHook(() => usePollingInterval(5000));
    act(() => {
      setVisibility('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(false);
  });

  it('passes false through (polling already disabled)', () => {
    const { result } = renderHook(() => usePollingInterval(false));
    expect(result.current).toBe(false);
  });
});
