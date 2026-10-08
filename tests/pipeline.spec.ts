import { expect, test } from './helpers/test'

test('the project page lists ten steps, opens any step, and tracks status and progress', async ({ page }) => {
  await page.goto('/app')
  await page.getByLabel('Search projects').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/app')
  await page.getByRole('link', { name: 'Acme rebrand' }).click()

  const steps = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3 }) })
  await expect(steps).toHaveCount(10)
  await expect(page.getByText('0/10 done')).toBeVisible()

  const brief = page.getByRole('listitem', { name: 'Project Brief' })
  await brief.getByRole('button', { name: 'Start project brief' }).click()
  await expect(page.locator('#document-root').getByRole('heading', { name: 'Project Brief' }).first()).toBeVisible()
  await page.goBack()

  await expect(brief.getByText('Draft', { exact: true })).toBeVisible()
  await brief.getByRole('button', { name: 'Mark done' }).click()
  await expect(page.getByText('1/10 done')).toBeVisible()

  const invoices = page.getByRole('listitem', { name: 'Invoice' })
  await expect(invoices.getByRole('link')).toHaveCount(1)
  await invoices.getByRole('button', { name: 'Add invoice' }).click()
  await expect(page).toHaveURL(/\/documents\//)
  await page.goBack()
  await expect(invoices.getByRole('link')).toHaveCount(2)
})
