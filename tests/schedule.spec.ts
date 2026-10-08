import { expect, test } from './helpers/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })
})

test('an agreement schedule creates deposit and balance invoices, and flags a sent invoice when the schedule changes', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search projects').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Acme rebrand' }).click()
  await page.getByLabel('Currency', { exact: true }).selectOption('EUR')
  await page.getByLabel('Number and date format').fill('en-US')
  await page.getByLabel('Project fee').fill('1000')
  await page.getByRole('button', { name: 'Save project' }).click()
  await expect(page.getByLabel('Project fee')).toHaveValue('1000')

  await page.getByRole('button', { name: 'Start client agreement' }).click()
  const pageRoot = page.locator('#document-root')
  await expect(pageRoot).toContainText('Payment schedule · €1,000.00')
  const agreementUrl = page.url()

  await pageRoot.getByRole('button', { name: 'Create invoice' }).first().click()
  await expect(page.locator('#document-root')).toContainText('Deposit (50%)')
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await expect(page.getByText('Sent · INV-0001')).toBeVisible()
  const depositUrl = page.url()

  await page.goto(agreementUrl)
  await expect(pageRoot.getByRole('button', { name: 'Open INV-0001' })).toBeVisible()
  await pageRoot.getByRole('button', { name: 'Create invoice' }).click()
  await expect(page.locator('#document-root')).toContainText('Less INV-0001')
  await expect(page.locator('#document-root')).toContainText('€500.00')

  await page.goto(agreementUrl)
  await pageRoot.getByLabel('Percent').first().fill('30')
  await expect(pageRoot.getByRole('alert')).toContainText('80%')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.goto(depositUrl)
  await expect(page.getByRole('alert').filter({ hasText: 'no longer matches' })).toContainText('no longer matches')
})
