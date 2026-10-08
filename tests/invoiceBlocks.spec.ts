import { expect, test } from './helpers/test'

test('an invoice is built from sections: terms can be added and moved, line items and totals cannot be hidden', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  const pageRoot = page.locator('#document-root')
  const sections = page.getByRole('navigation', { name: 'Blocks' })

  await expect(sections.getByRole('listitem')).toHaveCount(3)
  await expect(sections.getByRole('button', { name: 'Hide Line items' })).toHaveCount(0)
  await expect(sections.getByRole('button', { name: 'Hide Totals' })).toHaveCount(0)

  await sections.getByRole('button', { name: 'Add text' }).click()
  await expect(sections.getByRole('listitem')).toHaveCount(4)
  const terms = pageRoot.locator('[data-placeholder="Write something"]')
  await terms.click()
  await page.keyboard.type('Payment due within 14 days.')
  await page.keyboard.press('Enter')
  await expect(pageRoot.getByText('Payment due within 14 days.')).toBeVisible()

  await sections.getByRole('button', { name: 'Hide Bill to' }).click()
  await expect(pageRoot.getByRole('heading', { name: 'Bill to' })).toHaveCount(0)

  await expect(page.getByText('Saving…')).toBeVisible()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.reload()
  await expect(pageRoot.getByText('Payment due within 14 days.')).toBeVisible()
  await expect(pageRoot.getByRole('heading', { name: 'Bill to' })).toHaveCount(0)
})
