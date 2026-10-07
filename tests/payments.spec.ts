import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })
})

test('payments on a sent invoice update the balance and stamp, create receipts, and block going back to draft', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.getByRole('button', { name: 'Add item' }).click()
  const pageRoot = page.locator('#print-root')
  const price = pageRoot.locator('[data-numeric-cell]').nth(1)
  await price.click()
  await page.keyboard.type('100')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: 'Finalize anyway' }).click()
  const payments = page.getByRole('region', { name: 'Payments' })
  await expect(payments).toContainText('Unpaid')

  await payments.getByLabel('Amount received').fill('50')
  await payments.getByRole('button', { name: 'Record payment' }).click()
  await expect(payments).toContainText('Partly paid')
  await expect(pageRoot.locator('.watermark')).toHaveText('PARTLY PAID')
  await expect(page.getByRole('button', { name: 'Back to draft' })).toHaveCount(0)

  await payments.getByLabel('Amount received').fill('50')
  await payments.getByRole('button', { name: 'Record payment' }).click()
  await expect(payments.getByRole('heading')).toHaveText('Payments · Paid')
  await expect(pageRoot.locator('.watermark')).toHaveText('PAID')

  await payments.getByRole('button', { name: 'Create receipt' }).first().click()
  await expect(pageRoot.getByText('Payment received for INV-0001')).toBeVisible()
})
