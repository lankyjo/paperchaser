import { expect, test } from '@playwright/test'

test('project edits undo and redo on the project page, separately from document history', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Project title').fill('Original title')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Original title' }).click()

  await page.getByLabel('Title', { exact: true }).fill('Renamed')
  await page.getByRole('button', { name: 'Save project' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Renamed')

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Original title')
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Original title')
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Renamed')

  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  await expect(page.getByRole('button', { name: 'Undo' }).first()).toBeDisabled()
})
