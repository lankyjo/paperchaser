import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' — the auto-reload strategy is forbidden for a form app
      // (PITFALLS.md:320): it reloads tabs mid-edit and loses form data.
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Paperchaser',
        short_name: 'Paperchaser',
        description: 'Local-first invoice workspace',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
      },
      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Unit tests are colocated under src/**/__tests__/*.test.ts (02-RESEARCH.md
    // colocation pattern). Exclude the Playwright specs in tests/ — vitest's
    // default **/*.spec.ts glob would try to run them and fail.
    include: ['src/**/*.test.ts'],
    // Vitest 4 exits 1 on an empty suite unless passWithNoTests — the plan's
    // acceptance criteria require `pnpm exec vitest run` to exit 0 before any
    // unit test files exist (02-01-PLAN.md task 2).
    passWithNoTests: true,
  },
})
