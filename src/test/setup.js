import '@testing-library/jest-dom';
import { beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Default UI language for tests (matches assertions that expect English copy).
beforeEach(() => {
  try {
    localStorage.setItem('vdpconnect_language', 'EN');
  } catch (_e) { /* ignore */ }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};
