const OPENED_KEY = 'paperchaser.appOpened'

// Remembers that this browser has used the app, so the landing page steps aside next time.
export function markAppOpened() {
  try {
    localStorage.setItem(OPENED_KEY, '1')
  } catch {
    // Blocked storage only means the landing page shows again.
  }
}

export function hasOpenedApp(): boolean {
  try {
    return localStorage.getItem(OPENED_KEY) === '1'
  } catch {
    return false
  }
}
