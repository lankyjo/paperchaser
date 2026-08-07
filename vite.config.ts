import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
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
})
