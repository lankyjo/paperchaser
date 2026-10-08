import { expect, test } from './helpers/test'

test('an invoice reads its client from the project, can override it, and reset back', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search projects').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Acme rebrand' }).click()
  await page.getByLabel('New client for Acme rebrand').fill('Acme Coffee')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByLabel('Project fee').fill('3332')
  await page.getByRole('button', { name: 'Save project' }).click()
  await expect(page.getByLabel('Project fee')).toHaveValue('3332')

  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  const billTo = page.locator('section', { has: page.getByRole('heading', { name: 'Bill to' }) })
  const customerName = billTo.locator('[contenteditable]').first()
  await expect(customerName).toHaveText('Acme Coffee')

  await customerName.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('Acme Wholesale')
  await page.keyboard.press('Enter')
  await expect(billTo.getByRole('button', { name: 'Reset client name to project' })).toBeVisible()
  await expect(page.getByText('Saving…')).toBeVisible()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.reload()
  await expect(customerName).toHaveText('Acme Wholesale')
  await billTo.getByRole('button', { name: 'Reset client name to project' }).click()
  await expect(customerName).toHaveText('Acme Coffee')
})
