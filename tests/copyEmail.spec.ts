import { expect, test } from './helpers/test'

test('a sent invoice copies a prefilled email to the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    window.print = () => {}
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await page.getByRole('button', { name: 'Copy email message' }).click()
  await expect(page.getByRole('button', { name: 'Email copied' })).toBeVisible()
  const text = await page.evaluate(() => navigator.clipboard.readText())
  expect(text).toContain('Subject: Invoice INV-0001')
  expect(text).toContain('Please find attached invoice INV-0001')
})
