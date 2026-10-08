import { expect, test } from './helpers/test'

test('quick invoice opens an editable invoice in one click under an untitled project', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await expect(page).toHaveURL(/\/documents\//)
  await expect(page.locator('#document-root [contenteditable]').first()).toBeVisible()

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Untitled project' })).toBeVisible()
})

test('the command bar finds a project, Enter creates one from a new name, and I starts a quick invoice', async ({ page }) => {
  await page.goto('/')
  const bar = page.getByLabel('Search projects or name a new one')
  await bar.fill('Harbour signage')
  await bar.press('Enter')
  await expect(page).toHaveURL(/\/documents\//)

  await page.goto('/')
  await page.getByLabel('Search projects or name a new one').fill('harbour')
  await expect(page.getByRole('link', { name: 'Harbour signage' })).toBeVisible()
  await page.getByLabel('Search projects or name a new one').press('Enter')
  await expect(page).toHaveURL(/\/projects\//)

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Harbour signage' })).toBeVisible()
  await page.keyboard.press('i')
  await expect(page).toHaveURL(/\/documents\//)
})
