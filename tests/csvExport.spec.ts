import { expect, test } from './helpers/test'
import { readFileSync } from 'node:fs'

test('settings export sent invoices for a date range as CSV', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })
  await page.goto('/app')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await expect(page.getByText('Sent · INV-0001')).toBeVisible()

  await page.goto('/settings')
  const download = page.waitForEvent('download')
  await page.getByRole('region', { name: 'Export for your accountant' }).getByRole('button', { name: 'Download CSV' }).click()
  const csv = readFileSync(await (await download).path(), 'utf8')
  expect(csv.split('\n')[0]).toBe('Number,Type,Issued,Due,Client,Currency,Subtotal,Tax,Total,Paid,Balance,Status')
  expect(csv).toContain('INV-0001,Invoice,')
})
