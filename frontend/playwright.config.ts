import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node dist/src/main.js',
      cwd: '../backend',
      url: 'http://localhost:3001',
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run start',
      cwd: '.',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
