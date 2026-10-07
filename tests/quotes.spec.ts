import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })
})

test('a quote is revised as -R2, only the latest revision can be accepted, and acceptance sets the project fee', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Project title').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Acme rebrand' }).click()
  await expect(page).toHaveURL(/\/projects\//)
  const projectUrl = page.url()
  await page.getByRole('button', { name: 'Start quote' }).click()
  await page.getByLabel('Valid until').fill('2099-12-31')
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.locator('#print-root [data-numeric-cell]').nth(1).click()
  await page.keyboard.type('2500')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await expect(page.getByText('Sent · Q-0001')).toBeVisible()
  await expect(page.getByText('Awaiting answer')).toBeVisible()
  const firstUrl = page.url()

  await page.getByRole('button', { name: 'Revise' }).click()
  await expect(page).not.toHaveURL(firstUrl)
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await expect(page.getByText('Sent · Q-0001-R2')).toBeVisible()

  await page.goto(firstUrl)
  await expect(page.getByText('Superseded')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accept' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Open latest revision' }).click()
  await page.getByRole('button', { name: 'Accept' }).click()
  await expect(page.getByText('Accepted', { exact: true })).toBeVisible()

  await page.goto(projectUrl)
  await expect(page.getByLabel('Project fee')).toHaveValue('2500')
})

test('a declined quote can mark its project lost', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Untitled project' }).click()
  await expect(page).toHaveURL(/\/projects\//)
  const projectUrl = page.url()
  await page.getByRole('button', { name: 'Start quote' }).click()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await page.getByRole('button', { name: 'Decline' }).click()
  await page.getByRole('button', { name: 'Mark project lost' }).click()
  await expect(page.getByRole('button', { name: 'Mark project lost' })).toHaveCount(0)
  await page.goto(projectUrl)
  await expect(page.getByLabel('Status')).toHaveValue('lost')
})
