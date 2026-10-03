import { existsSync } from 'node:fs'

import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config. The suite drives the real app in a browser against a running API,
 * so it needs the backend stack up (the CrewFinding API on :4000, its DB, and SMTP/IMAP creds
 * for the email-dependent specs — see tests/e2e/README.md).
 *
 * The app dev server is started automatically (or reused if already running).
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

/**
 * Playwright refuses to install its own Chromium on Intel macOS ("does not
 * support chromium on mac12"), so `npx playwright install` fails and the whole
 * suite looks unrunnable on those machines. The system Chrome works fine —
 * point at it instead of downloading one.
 *
 * Resolved at config level, not per-spec, so no test has to know: set
 * E2E_CHROME_PATH to override, otherwise fall back to the standard macOS
 * location when it exists, otherwise let Playwright use its bundled browser.
 */
const SYSTEM_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chromePath =
  process.env.E2E_CHROME_PATH ?? (existsSync(SYSTEM_CHROME) ? SYSTEM_CHROME : undefined)

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromePath ? { launchOptions: { executablePath: chromePath } } : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
