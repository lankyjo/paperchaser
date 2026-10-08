import { expect, test } from '@playwright/test'

test('a new visitor sees the landing page, and opening the app makes / go straight to it', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /Paperwork/ })).toBeVisible()
  await page.getByRole('link', { name: 'Start for free' }).click()
  await expect(page).toHaveURL(/\/app$/)
  await page.goto('/')
  await expect(page).toHaveURL(/\/app$/)
})

test('the about page always shows the landing page', async ({ page }) => {
  await page.goto('/app')
  await page.goto('/about')
  await expect(page.getByRole('heading', { level: 1, name: /Paperwork/ })).toBeVisible()
})
