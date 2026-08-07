import { defineConfig, devices } from '@playwright/test'

/**
 * Golden-image parity harness config (plan 01-02).
 * The harness runs against the PRODUCTION build (vite preview) — the parity
 * contract is about what ships, not dev (RESEARCH Pattern 2).
 * DPR pinned to 1 so CSS pixels equal PDF-point pixels at scale 1 (Pitfall 3).
 * Chromium only: page.pdf() is Chromium-only (research A1); Safari 18.2+ is the
 * documented manual acceptance step in ADR 0002.
 */
export default defineConfig({
  testDir: 'tests',
  outputDir: 'tests/artifacts/',
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    deviceScaleFactor: 1,
  },
  webServer: {
    command: 'pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
