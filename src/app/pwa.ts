import { registerSW } from 'virtual:pwa-register'
import { updateStore } from './updateStore'

// 'prompt' registration, never autoUpdate: autoUpdate reloads tabs mid-edit and loses form data.
export const updateSW = registerSW({
  onNeedRefresh: updateStore.markReady,
})

// Requests persistent storage to reduce IndexedDB eviction risk; fire and forget.
void navigator.storage?.persist?.()
