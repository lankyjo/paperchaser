import { expect, test } from './helpers/test'

test.beforeEach(async ({ page }) => {
  // Records print calls and the tab title at that moment instead of opening a real print dialog.
  await page.addInitScript(() => {
    const w = window as unknown as { __prints: string[] }
    w.__prints = []
    window.print = () => void w.__prints.push(document.title)
  })
})

const prints = (page: import('./helpers/test').Page) => page.evaluate(() => (window as unknown as { __prints: string[] }).__prints)

test('finalize warns, numbers, locks and prints; back to draft keeps the number', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  const pageRoot = page.locator('#document-root')
  await expect(pageRoot.locator('[contenteditable="true"]').first()).toBeVisible()

  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await expect(page.getByRole('list', { name: 'Before you send' })).toContainText('The client address is missing')
  await page.getByRole('button', { name: 'Finalize anyway' }).click()

  await expect(page.getByText('Sent · INV-0001')).toBeVisible()
  await expect(pageRoot.locator('[contenteditable="true"]')).toHaveCount(0)
  await expect.poll(() => prints(page)).toEqual(['Invoice INV-0001'])
  await expect(page.getByRole('button', { name: 'Undo' }).first()).toBeDisabled()

  await page.reload()
  await expect(page.getByText('Sent · INV-0001')).toBeVisible()
  await page.getByRole('button', { name: 'Back to draft' }).click()
  await expect(pageRoot.locator('[contenteditable="true"]').first()).toBeVisible()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: 'Finalize anyway' }).click()
  await expect(page.getByText('Sent · INV-0001')).toBeVisible()
})

test('numbering settings warn before reusing numbers', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: 'Finalize anyway' }).click()
  await expect(page.getByText('Sent · INV-0001')).toBeVisible()

  await page.goto('/settings')
  const invoices = page.getByRole('listitem', { name: 'Invoice' })
  await expect(invoices.getByLabel('Next number')).toHaveValue('2')
  await invoices.getByLabel('Prefix').fill('INV-{YYYY}-')
  await expect(invoices).toContainText(`next: INV-${new Date().getFullYear()}-0002`)
  await invoices.getByLabel('Next number').fill('1')
  await expect(invoices.getByRole('alert')).toContainText('duplicate numbers')
})

test('an unsent invoice keeps its snapshot until the latest project data is pulled', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search projects').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Acme rebrand' }).click()
  await page.getByLabel('New client for Acme rebrand').fill('Acme Coffee')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: 'Finalize anyway' }).click()
  await page.getByRole('button', { name: 'Back to draft' }).click()
  await expect(page.getByRole('button', { name: 'Finalize and print' })).toBeVisible()
  const invoiceUrl = page.url()

  await page.goto('/clients')
  const card = page.getByRole('listitem').filter({ hasText: 'Acme Coffee' })
  await card.getByRole('button', { name: 'Edit' }).click()
  await card.getByLabel('Name').fill('Acme Coffee Roasters')
  await card.getByRole('button', { name: 'Save client' }).click()
  await expect(card.getByLabel('Name')).toHaveCount(0)
  await page.goto(invoiceUrl)

  const billTo = page.locator('#document-root section', { has: page.getByRole('heading', { name: 'Bill to' }) })
  await expect(billTo.locator('[contenteditable]').first()).toHaveText('Acme Coffee')
  await expect(page.getByRole('status').filter({ hasText: 'Project data changed' })).toContainText('Client name: Acme Coffee → Acme Coffee Roasters')
  await page.getByRole('button', { name: 'Pull latest' }).click()
  await expect(billTo.locator('[contenteditable]').first()).toHaveText('Acme Coffee Roasters')
})
