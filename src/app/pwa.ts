import { registerSW } from 'virtual:pwa-register'

// 'prompt' registration, never autoUpdate: autoUpdate reloads tabs mid-edit and loses form data.
export const updateSW = registerSW({
  onNeedRefresh() {
    // Update-available banner not built yet; it will call updateSW(true).
  },
  onOfflineReady() {
    // Offline-ready banner not built yet.
  },
})

// Requests persistent storage to reduce IndexedDB eviction risk; fire and forget.
void navigator.storage?.persist?.()
