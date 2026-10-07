import { expect, test } from '@playwright/test'

// A fresh browser context starts with an empty IndexedDB; a same-context reload keeps it.
test('a new project opens its invoice, and edits survive a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Project title').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await expect(page).toHaveURL(/\/documents\//)

  const customerName = page.locator('section', { has: page.getByRole('heading', { name: 'Bill to' }) }).locator('[contenteditable]').first()
  await customerName.click()
  await page.keyboard.type('Acme Coffee Roasters')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Saving…')).toBeVisible()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.reload()
  await expect(customerName).toHaveText('Acme Coffee Roasters')

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Acme rebrand' })).toBeVisible()
})

test('an edit is kept when leaving the editor inside the app before autosave fires', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await expect(page).toHaveURL(/\/documents\//)
  const docUrl = page.url()
  const customerName = page.locator('section', { has: page.getByRole('heading', { name: 'Bill to' }) }).locator('[contenteditable]').first()
  await customerName.click()
  await page.keyboard.type('Left in a hurry')
  await page.keyboard.press('Enter')
  await page.getByRole('link', { name: 'Project' }).first().click()
  await expect(page).toHaveURL(/\/projects\//)
  await page.goto(docUrl)
  await expect(customerName).toHaveText('Left in a hurry')
})
