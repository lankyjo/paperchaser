import { registerSW } from 'virtual:pwa-register'

/**
 * Service-worker registration with the 'prompt' strategy — never autoUpdate
 * (PITFALLS.md:320): autoUpdate reloads tabs mid-edit and loses form data for
 * a form app. The update banner UI is Phase 6 scope; handlers are empty for
 * the spike.
 */
export const updateSW = registerSW({
  onNeedRefresh() {
    /* Phase 6: show "Update available" banner → updateSW(true) */
  },
  onOfflineReady() {
    /* Phase 6: ready banner */
  },
})

// Reduces IndexedDB eviction risk (PITFALLS.md:91) — fire and forget.
void navigator.storage?.persist?.()
