import '@testing-library/jest-dom/vitest';

// jsdom doesn't ship matchMedia. Default to the "mobile" snapshot (matches:
// false). Tests that need to flip to desktop can override window.matchMedia
// before rendering. Without this stub, components using useSyncExternalStore
// + window.matchMedia would crash during commit.
// jsdom doesn't implement scrollIntoView; stub on the prototype so any
// element.scrollIntoView() call is a no-op rather than a TypeError.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

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
