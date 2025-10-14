import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e/tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:5173',
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});


