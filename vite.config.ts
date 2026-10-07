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
      // 'prompt', never auto-reload: auto-reload refreshes tabs mid-edit and loses form data.
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
    // Unit tests live in src/**/__tests__; Playwright specs in tests/ are excluded.
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    // Vitest exits 1 on an empty suite without this flag.
    passWithNoTests: true,
  },
})
