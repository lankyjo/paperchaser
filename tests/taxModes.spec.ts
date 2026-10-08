import { expect, test } from './helpers/test'

test('the project tax mode changes how invoice totals are labelled', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/app')
  await page.getByRole('link', { name: 'Untitled project' }).click()

  await page.getByLabel('Tax', { exact: true }).selectOption('inclusive')
  await page.getByRole('button', { name: 'Save project' }).click()
  await expect(page.getByLabel('Tax', { exact: true })).toHaveValue('inclusive')
  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  await expect(page.locator('#document-root').getByText('Includes tax')).toBeVisible()

  await page.goBack()
  await page.getByLabel('Tax', { exact: true }).selectOption('none')
  await page.getByRole('button', { name: 'Save project' }).click()
  await expect(page.getByLabel('Tax', { exact: true })).toHaveValue('none')
  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  await expect(page.locator('#document-root').getByText('Grand total')).toBeVisible()
  await expect(page.locator('#document-root').getByText(/^(Tax|Includes tax)$/)).toHaveCount(0)
})
