import { describe, expect, it } from 'vitest'
import { isBackupDue, isLikelyPrivateMode, shouldSuggestHomeScreen } from '../dataSafety'

const now = new Date('2026-10-20T12:00:00Z')

describe('isBackupDue', () => {
  it('is due when there is data and no backup yet', () => {
    expect(isBackupDue(undefined, now, true)).toBe(true)
  })

  it('is not due with nothing to back up', () => {
    expect(isBackupDue(undefined, now, false)).toBe(false)
  })

  it('is due once the last backup is more than 7 days old', () => {
    expect(isBackupDue('2026-10-14T12:00:00Z', now, true)).toBe(false)
    expect(isBackupDue('2026-10-12T11:00:00Z', now, true)).toBe(true)
  })
})

describe('shouldSuggestHomeScreen', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  const macSafari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
  const chrome = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'

  it('suggests installing in iPhone and Mac Safari tabs', () => {
    expect(shouldSuggestHomeScreen(iphone, false)).toBe(true)
    expect(shouldSuggestHomeScreen(macSafari, false)).toBe(true)
  })

  it('stays quiet once installed, and in other browsers', () => {
    expect(shouldSuggestHomeScreen(iphone, true)).toBe(false)
    expect(shouldSuggestHomeScreen(chrome, false)).toBe(false)
  })
})

describe('isLikelyPrivateMode', () => {
  it('flags the small storage quota private windows get', () => {
    expect(isLikelyPrivateMode(100 * 1024 * 1024)).toBe(true)
    expect(isLikelyPrivateMode(2 * 1024 * 1024 * 1024)).toBe(false)
    expect(isLikelyPrivateMode(undefined)).toBe(false)
  })
})
