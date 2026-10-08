import { expect, test } from './helpers/test'

test('a project in Nigerian naira with British formatting prints amounts that way, and the fee accepts that format', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Untitled project' }).click()

  await page.getByLabel('Currency', { exact: true }).selectOption('NGN')
  await page.getByLabel('Number and date format').fill('en-GB')
  await page.getByLabel('Project fee').fill('1,250,000.50')
  await page.getByRole('button', { name: 'Save project' }).click()
  await expect(page.getByLabel('Currency', { exact: true })).toHaveValue('NGN')
  await page.reload()
  await expect(page.getByLabel('Project fee')).toHaveValue('1250000.5')

  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  await expect(page.locator('#document-root').getByText('Grand total').locator('..')).toContainText('NGN')
})
