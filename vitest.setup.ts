import '@testing-library/jest-dom/vitest';

// jsdom doesn't ship matchMedia. Default to the "mobile" snapshot (matches:
// false). Tests that need to flip to desktop can override window.matchMedia
// before rendering. Without this stub, components using useSyncExternalStore
// + window.matchMedia would crash during commit.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
