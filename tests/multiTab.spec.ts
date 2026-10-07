import { expect, test, type Page } from '@playwright/test'

const customerName = (page: Page) =>
  page.locator('#document-root section', { has: page.getByRole('heading', { name: 'Bill to' }) }).locator('[contenteditable]').first()

async function typeCustomer(page: Page, text: string) {
  await customerName(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type(text)
  await page.keyboard.press('Enter')
}

test('an idle second tab follows edits live; a tab whose edit is based on an old revision goes read-only', async ({ context }) => {
  const a = await context.newPage()
  await a.goto('/')
  await a.getByRole('button', { name: 'Quick invoice' }).click()
  await expect(a).toHaveURL(/\/documents\//)
  const b = await context.newPage()
  await b.goto(a.url())
  await expect(customerName(b)).toBeVisible()

  await typeCustomer(a, 'Acme Coffee')
  await expect(a.getByText('Saved', { exact: true })).toBeVisible()
  await expect(customerName(b)).toHaveText('Acme Coffee')

  // B misses A's next save (as if the broadcast were lost), then saves on top of an old revision.
  await b.addInitScript(() => {
    Object.defineProperty(BroadcastChannel.prototype, 'onmessage', { set() {}, configurable: true })
  })
  await b.reload()
  await expect(customerName(b)).toHaveText('Acme Coffee')
  await typeCustomer(a, 'Acme Coffee Roasters')
  await expect(a.getByText('Saved', { exact: true })).toBeVisible()
  await expect(customerName(b)).toHaveText('Acme Coffee')
  await typeCustomer(b, 'Stale edit')
  await expect(b.getByRole('button', { name: 'Changed in another tab — reload' })).toBeVisible()
  await a.reload()
  await expect(customerName(a)).toHaveText('Acme Coffee Roasters')
  await expect(b.locator('#document-root [contenteditable="true"]')).toHaveCount(0)
})
