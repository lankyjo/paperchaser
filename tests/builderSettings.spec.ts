import { expect, test } from '@playwright/test'

test('undo restores the template and page size the builder shows', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  const gallery = page.getByRole('radiogroup', { name: 'Template gallery' })
  const initial = await gallery.getByRole('radio', { checked: true }).textContent()

  await gallery.getByRole('radio', { name: 'Modern' }).click()
  await expect(gallery.getByRole('radio', { name: 'Modern' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(gallery.getByRole('radio', { checked: true })).toHaveText(initial ?? '')

  const headerSize = page.getByRole('combobox', { name: 'Page size' }).first()
  await headerSize.click()
  await page.getByRole('option', { name: 'A5' }).click()
  await expect(headerSize).toHaveText(/^a5/i)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(headerSize).toHaveText(/^a4/i)
})

test('the selected item shows its price in the project currency', async ({ page }) => {
  await page.goto('/services')
  const form = page.getByRole('region', { name: 'New service' })
  await form.getByLabel('Service name').fill('Logo design')
  await form.getByLabel('Price').fill('1200')
  await form.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('listitem', { name: 'Logo design' })).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Untitled project' }).click()
  await page.getByLabel('Currency', { exact: true }).selectOption('JPY')
  await page.getByLabel('Number and date format').fill('en-US')
  await page.getByRole('button', { name: 'Save project' }).click()
  await expect(page.getByLabel('Currency', { exact: true })).toHaveValue('JPY')

  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  await page.getByLabel('Add from services').selectOption({ label: 'Logo design' })
  await page.locator('aside').getByText('Logo design').first().click()
  await expect(page.locator('aside').getByText('Unit price', { exact: true }).locator('..')).toContainText('¥120,000')
})
