// Whether a new app version is waiting; the service worker sets it, the update banner reads it.
let ready = false
const listeners = new Set<() => void>()

export const updateStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  isReady: () => ready,
  markReady() {
    ready = true
    listeners.forEach((listener) => listener())
  },
}
