import { expect, test } from '@playwright/test'

test('the desktop workspace remembers its layout across reloads and panels maximize', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await expect(page.locator('#document-root')).toBeVisible()
  for (const tab of ['Outline', 'Document', 'Properties', 'About this step', 'Pipeline', 'Projects']) {
    await expect(page.locator('.dv-tab').filter({ hasText: tab })).toHaveCount(1)
  }

  const projects = page.getByRole('navigation', { name: 'All projects' })
  await expect(projects).toBeHidden()
  await page.locator('.dv-tab').filter({ hasText: 'Projects' }).click()
  await expect(projects).toBeVisible()
  await page.reload()
  await expect(projects).toBeVisible()

  await page.getByRole('button', { name: 'Maximize panel' }).first().click()
  await expect(page.getByRole('button', { name: 'Restore panel size' })).toBeVisible()
})
