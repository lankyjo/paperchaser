import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// Production-only Content-Security-Policy: no inline scripts, no remote images, network limited to OpenRouter and local models.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://openrouter.ai http://localhost:* http://127.0.0.1:*",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const contentSecurityPolicy: Plugin = {
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY }, injectTo: 'head-prepend' }],
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    contentSecurityPolicy,
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt', never auto-reload: auto-reload refreshes tabs mid-edit and loses form data.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Paperchaser',
        short_name: 'Paperchaser',
        description: 'Client paperwork for freelancers, from quote to feedback. Free and offline.',
        start_url: '/app',
        display: 'standalone',
        theme_color: '#1f1b17',
        background_color: '#1f1b17',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
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
