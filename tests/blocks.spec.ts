import { expect, test } from '@playwright/test'

test('a welcome document is built from blocks that can be edited, hidden, reordered and added, and survives a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Project title').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Acme rebrand' }).click()
  await page.getByRole('button', { name: 'New welcome document' }).click()

  const pageRoot = page.locator('#print-root')
  await expect(pageRoot.getByRole('heading', { name: 'Welcome to the team' })).toBeVisible()

  const heading = pageRoot.getByRole('heading', { name: 'Welcome to the team' }).locator('[contenteditable]')
  await heading.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('Welcome, Acme')
  await page.keyboard.press('Enter')
  await expect(pageRoot.getByRole('heading', { name: 'Welcome, Acme' })).toBeVisible()

  await page.getByRole('button', { name: 'Hide Text' }).click()
  await expect(pageRoot.getByText("We're excited to work with you")).toHaveCount(0)

  await page.getByRole('button', { name: 'Move Details list up' }).click()
  await page.getByRole('button', { name: 'Add heading' }).click()
  const outline = page.getByRole('navigation', { name: 'Blocks' }).getByRole('listitem')
  await expect(outline).toHaveCount(4)
  await expect(outline.nth(1)).toContainText('Details list')

  await expect(page.getByText('Saving…')).toBeVisible()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.reload()
  await expect(pageRoot.getByRole('heading', { name: 'Welcome, Acme' })).toBeVisible()
  await expect(pageRoot.getByText("We're excited to work with you")).toHaveCount(0)
  await expect(outline).toHaveCount(4)
})
