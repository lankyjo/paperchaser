import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })
})

test('an overdue invoice is listed on the dashboard, gets an unnumbered reminder, and a lost project flags it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.getByLabel('Due date').fill('2020-01-31')
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.locator('#document-root [data-numeric-cell]').nth(1).click()
  await page.keyboard.type('100')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await expect(page.getByText('Sent · INV-0001')).toBeVisible()

  await page.goto('/')
  const overdue = page.getByRole('region', { name: 'Overdue invoices' })
  await expect(overdue).toContainText('INV-0001')
  await expect(overdue).toContainText('days overdue')
  await overdue.getByRole('button', { name: 'Send reminder' }).click()
  await expect(page.locator('#document-root')).toContainText('Payment reminder')
  await expect(page.locator('#document-root')).toContainText('INV-0001')
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await expect(page.getByText('Sent', { exact: true })).toBeVisible()

  await page.goto('/')
  await page.getByRole('link', { name: 'Untitled project' }).click()
  await page.getByLabel('Status').selectOption('lost')
  await expect(page.getByRole('alert')).toContainText('still open')
  await expect(page.getByRole('alert').getByRole('link', { name: 'INV-0001' })).toBeVisible()
})
