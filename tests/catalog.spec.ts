import { expect, test } from './helpers/test'

test('a saved service is inserted into an invoice as a priced line item', async ({ page }) => {
  await page.goto('/services')
  const form = page.getByRole('region', { name: 'New service' })
  await form.getByLabel('Service name').fill('Logo design')
  await form.getByLabel('Service description').fill('Three concepts')
  await form.getByLabel('Price').fill('1200')
  await form.getByLabel('Tax %').fill('19')
  await form.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('listitem', { name: 'Logo design' })).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.getByLabel('Add from services').selectOption({ label: 'Logo design' })
  const pageRoot = page.locator('#document-root')
  await expect(pageRoot).toContainText('Logo design')
  await expect(pageRoot).toContainText('Three concepts')
  await expect(pageRoot.getByText('Grand total').locator('..')).toContainText('1,428.00')
})
