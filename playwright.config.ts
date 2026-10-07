import { defineConfig, devices } from '@playwright/test'

// Parity runs against the production preview build in Chromium (page.pdf is Chromium-only); DPR 1 keeps CSS px equal to PDF px.
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
