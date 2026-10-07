import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })
})

async function sentInvoiceOf100(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.locator('#document-root [data-numeric-cell]').nth(1).click()
  await page.keyboard.type('100')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: 'Finalize anyway' }).click()
}

test('an unpaid invoice can be voided, keeps its number, and the next invoice does not reuse it', async ({ page }) => {
  await sentInvoiceOf100(page)
  await expect(page.getByText('Sent · INV-0001')).toBeVisible()
  await page.getByRole('button', { name: 'Void', exact: true }).click()
  await page.getByRole('button', { name: 'Void invoice' }).click()
  await expect(page.getByText('Void · INV-0001')).toBeVisible()
  await expect(page.locator('#document-root .watermark')).toHaveText('VOID')
  await expect(page.getByRole('button', { name: 'Back to draft' })).toHaveCount(0)

  await sentInvoiceOf100(page)
  await expect(page.getByText('Sent · INV-0002')).toBeVisible()
})

test('a paid invoice cannot be voided; a credit note gets its own number and reduces the balance', async ({ page }) => {
  await sentInvoiceOf100(page)
  const payments = page.getByRole('region', { name: 'Payments' })
  await payments.getByLabel('Amount received').fill('100')
  await payments.getByRole('button', { name: 'Record payment' }).click()
  await expect(payments.getByRole('heading')).toHaveText('Payments · Paid')
  await expect(page.getByRole('button', { name: 'Void', exact: true })).toHaveCount(0)
  const invoiceUrl = page.url()

  await payments.getByRole('button', { name: 'Issue credit note' }).click()
  await expect(page.locator('#document-root')).toContainText('Credit Note')
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await expect(page.getByText('Sent · CN-0001')).toBeVisible()

  await page.goto(invoiceUrl)
  await expect(payments.getByRole('heading')).toHaveText('Payments · Overpaid')
  await expect(payments.getByRole('button', { name: 'Credit note CN-0001' })).toBeVisible()
})
