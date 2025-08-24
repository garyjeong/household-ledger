require('@testing-library/jest-dom')

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {}

  observe() {}

  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}

  disconnect() {}

  observe() {}

  unobserve() {}
}

// Mock matchMedia (only for browser environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock localStorage (only for browser environment)
if (typeof window !== 'undefined') {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  global.localStorage = localStorageMock
}

// Mock clipboard API (only for browser environment)
if (typeof navigator !== 'undefined') {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockImplementation(() => Promise.resolve()),
    },
  })
}
