// jest.config.js
// Jest configuration for the monorepo

module.exports = {
  projects: [
    {
      displayName: 'm-permits-inspections',
      testMatch: ['<rootDir>/apps/m-permits-inspections/**/__tests__/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/apps/m-permits-inspections/__tests__/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/m-permits-inspections/$1',
      },
    },
    {
      displayName: 'm-ops-services',
      testMatch: ['<rootDir>/apps/m-ops-services/**/__tests__/**/*.test.{ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/apps/m-ops-services/__tests__/setup.ts'],
    },
    {
      displayName: 'web-main',
      testMatch: ['<rootDir>/apps/web-main/**/__tests__/**/*.test.{ts,tsx}'],
      testEnvironment: 'node',
      transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/apps/web-main/tsconfig.json' }] },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/web-main/$1',
      },
    },
  ],
  collectCoverageFrom: [
    'apps/**/*.{ts,tsx}',
    '!apps/**/*.d.ts',
    '!apps/**/__tests__/**',
    '!apps/**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
