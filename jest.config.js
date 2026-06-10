// jest.config.js
// Jest configuration for the monorepo

/** Directories that contain duplicate package.json names — exclude from Haste map */
const IGNORE_PATHS = [
  '/\\.next/',
  '/website-versions/',
  '/services/command-center/local/',
  '/node_modules/',
];

module.exports = {
  // Prevent Haste module map collisions from .next builds, local copies, and old versions
  modulePathIgnorePatterns: IGNORE_PATHS,
  testPathIgnorePatterns: IGNORE_PATHS,
  projects: [
    {
      displayName: 'm-permits-inspections',
      testMatch: ['<rootDir>/apps/m-permits-inspections/**/__tests__/**/*.test.{ts,tsx}'],
      testEnvironment: '<rootDir>/jest-environments/jsdom-canvas-mock.js',
      // Override jsx: preserve → react so ts-jest emits valid JS (preserve is for Next.js/SWC, not Jest)
      transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }] },
      setupFilesAfterEnv: ['<rootDir>/apps/m-permits-inspections/__tests__/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/m-permits-inspections/$1',
      },
      modulePathIgnorePatterns: IGNORE_PATHS,
    },
    {
      displayName: 'm-ops-services',
      testMatch: ['<rootDir>/apps/m-ops-services/**/__tests__/**/*.test.{ts,tsx}'],
      testEnvironment: '<rootDir>/jest-environments/jsdom-canvas-mock.js',
      // Override jsx: preserve → react so ts-jest emits valid JS (preserve is for Next.js/SWC, not Jest)
      transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }] },
      setupFilesAfterEnv: ['<rootDir>/apps/m-ops-services/__tests__/setup.ts'],
      modulePathIgnorePatterns: IGNORE_PATHS,
    },
    {
      displayName: 'web-main',
      testMatch: ['<rootDir>/apps/web-main/**/__tests__/**/*.test.{ts,tsx}'],
      testEnvironment: 'node',
      transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/apps/web-main/tsconfig.json' }] },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/web-main/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/apps/web-main/__tests__/setup.ts'],
      modulePathIgnorePatterns: IGNORE_PATHS,
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
