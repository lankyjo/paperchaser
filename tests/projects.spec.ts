import { expect, test } from '@playwright/test'

test('quick invoice opens an editable invoice in one click under an untitled project', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await expect(page).toHaveURL(/\/documents\//)
  await expect(page.locator('#document-root [contenteditable]').first()).toBeVisible()

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Untitled project' })).toBeVisible()
})
