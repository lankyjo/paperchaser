import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Records print calls instead of opening a real print dialog.
  await page.addInitScript(() => {
    const w = window as unknown as { __prints: number }
    w.__prints = 0
    window.print = () => void (w.__prints += 1)
  })
})

// The focused element's accessible label: aria-label, else its text.
const focusedName = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    return (el?.getAttribute('aria-label') ?? el?.textContent ?? '').trim()
  })

// Presses Tab (or Shift+Tab) until the focused element's name matches, proving it is reachable by keyboard.
async function tabTo(page: Page, name: string, key: 'Tab' | 'Shift+Tab' = 'Tab', maxPresses = 150) {
  for (let i = 0; i < maxPresses; i++) {
    await page.keyboard.press(key)
    if ((await focusedName(page)) === name) return
  }
  throw new Error(`"${name}" is not reachable with Tab`)
}

test('a document can be created, edited and finalized with the keyboard alone', async ({ page }) => {
  await page.goto('/')
  await tabTo(page, 'Quick invoice')
  await page.keyboard.press('Enter')
  await expect(page.locator('#document-root')).toBeVisible()

  await tabTo(page, 'Got it')
  await page.keyboard.press('Enter')

  await tabTo(page, 'Add item')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('complementary', { name: 'Outline' }).getByText('Untitled', { exact: true })).toBeVisible()

  // Tab into the page's first editable text, type, and Tab away to commit it.
  for (let i = 0; i < 150 && !(await page.evaluate(() => document.activeElement?.closest('#document-root [contenteditable="true"]') !== null)); i++) await page.keyboard.press('Tab')
  await page.keyboard.type('Acme Coffee')
  await page.keyboard.press('Tab')
  await expect(page.locator('#document-root')).toContainText('Acme Coffee')

  await tabTo(page, 'Finalize and print', 'Shift+Tab')
  await page.keyboard.press('Enter')
  await tabTo(page, 'Finalize anyway')
  await page.keyboard.press('Enter')
  await expect(page.getByText(/Sent · INV-0001/)).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __prints: number }).__prints)).toBe(1)
})
