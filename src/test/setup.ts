import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
