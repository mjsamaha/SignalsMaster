import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for SignalsMaster
 *
 * Targets Ionic app running on localhost:8100
 * Sequential execution (workers: 1) to reduce resource usage
 */
export default defineConfig({
  testDir: './src',
  testMatch: '**/*.e2e.ts',

  // Force sequential execution
  workers: 1,

  // Timeout configuration
  timeout: 30000,
  expect: {
    timeout: 5000
  },

  // Fail fast - stop on first failure
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],

  // Shared settings for all projects
  use: {
    baseURL: 'http://localhost:8100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test on additional browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Start dev server before tests (optional)
  // webServer: {
  //   command: 'npm start',
  //   url: 'http://localhost:8100',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
