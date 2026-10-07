const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000
// Private windows get a small storage quota; normal profiles get gigabytes. ponytail: a heuristic, browsers do not expose private mode.
const PRIVATE_QUOTA_BYTES = 120 * 1024 * 1024

// A backup is due when there is data and none was downloaded in the last 7 days.
export function isBackupDue(lastBackupAt: string | undefined, now: Date, hasData: boolean): boolean {
  if (!hasData) return false
  return lastBackupAt === undefined || now.getTime() - new Date(lastBackupAt).getTime() > BACKUP_INTERVAL_MS
}

// Safari deletes site data after 7 days without a visit unless the app is added to the Home Screen or Dock.
export function shouldSuggestHomeScreen(userAgent: string, standalone: boolean): boolean {
  if (standalone) return false
  const ios = /iPhone|iPad|iPod/.test(userAgent)
  const desktopSafari = /Version\/[\d.]+.*Safari/.test(userAgent) && !/Chrome|Chromium|CriOS|FxiOS|Edg/.test(userAgent)
  return ios || desktopSafari
}

export const isLikelyPrivateMode = (quota: number | undefined) => quota !== undefined && quota < PRIVATE_QUOTA_BYTES
