const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/tests/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  testEnvironment: 'jsdom',
  // Node.js API 테스트를 위한 오버라이드
  projects: [
    {
      displayName: 'browser',
      testMatch: [
        '<rootDir>/tests/components/**/*.(test|spec).(js|jsx|ts|tsx)',
        '<rootDir>/tests/integration/**/*.(test|spec).(js|jsx|ts|tsx)',
        '<rootDir>/tests/lib/**/*.(test|spec).(js|jsx|ts|tsx)',
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'node',
      testMatch: ['<rootDir>/tests/api/**/*.(test|spec).(js|jsx|ts|tsx)'],
      testEnvironment: 'node',
    },
  ],
}

module.exports = createJestConfig(customJestConfig)