import { expect, test } from '@playwright/test'

test('"New for next month" starts a draft a month later from a monthly report', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Untitled project' }).click()
  await page.getByRole('button', { name: 'Start monthly report' }).click()
  const heading = page.locator('#document-root h2 [contenteditable]').first()
  await heading.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('Results for December 2026')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  const firstUrl = page.url()

  await page.getByRole('button', { name: 'New for next month' }).click()
  await expect(page).not.toHaveURL(firstUrl)
  await expect(page.locator('#document-root')).toContainText('Results for January 2027')
  await page.goBack()
  await expect(page.locator('#document-root')).toContainText('Results for December 2026')
})
