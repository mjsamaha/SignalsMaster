module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Force sequential execution to reduce resource usage
  maxWorkers: 1,

  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        strict: false,
        resolveJsonModule: true,
        jsx: 'react'
      }
    }]
  },

  // Module name mapping for Angular-style imports
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@environments/(.*)$': '<rootDir>/src/environments/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/app/**/*.{ts,tsx}',
    '!src/app/**/*.module.ts',
    '!src/app/**/*.routes.ts',
    '!src/app/**/index.ts',
    '!src/main.ts',
    '!src/polyfills.ts'
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/www/',
    '\\.e2e\\.ts$'
  ],

  // Transform Angular ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|@ionic|@capacitor|ionicons)/)'
  ],

  // Global settings
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: true
    }
  },

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
