import { expect, test } from './helpers/test'

test('a step explains itself on first open, collapses once dismissed, and stays collapsed after that', async ({ page }) => {
  await page.goto('/app')
  await page.getByLabel('Search projects').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await expect(page).toHaveURL(/\/(documents|projects)\//)
  await page.goto('/app')
  await page.getByRole('link', { name: 'Acme rebrand' }).click()
  await expect(page.getByRole('listitem', { name: 'Project Brief' }).getByText('Define exactly what the work should achieve')).toBeVisible()

  await page.getByRole('button', { name: 'Start project brief' }).click()
  const guide = page.getByRole('complementary', { name: 'About the Project Brief' })
  await expect(guide).toBeVisible()
  await guide.getByRole('button', { name: 'Got it' }).click()
  await expect(guide).toHaveCount(0)

  await page.reload()
  await page.getByRole('tab', { name: 'About this step' }).click()
  await expect(page.getByRole('button', { name: 'About this step' })).toBeVisible()
  await expect(guide).toHaveCount(0)
  await page.getByRole('button', { name: 'About this step' }).click()
  await expect(guide).toBeVisible()
})
