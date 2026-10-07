import { expect, test } from '@playwright/test'

test('a client created on a project is reused, cannot be deleted while in use, and can be archived', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Project title').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByLabel('New client for Acme rebrand').fill('Acme Coffee')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByLabel('Client for Acme rebrand', { exact: true }).locator('option:checked')).toHaveText('Acme Coffee')

  await page.getByRole('link', { name: 'Clients' }).click()
  const card = page.getByRole('listitem').filter({ hasText: 'Acme Coffee' })
  await expect(card.getByText('Used by 1 drafts in 1 projects')).toBeVisible()
  await expect(card.getByRole('button', { name: 'Delete' })).toBeDisabled()

  await card.getByRole('button', { name: 'Edit' }).click()
  await card.getByLabel('Email').fill('accounts@acme.test')
  await card.getByRole('button', { name: 'Save client' }).click()
  await expect(card.getByLabel('Email')).toHaveCount(0)

  await card.getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByText('Acme Coffee')).toHaveCount(0)
  await page.getByLabel('Show archived').check()
  await expect(page.getByRole('listitem').filter({ hasText: 'Acme Coffee' }).getByText('Archived', { exact: true })).toBeVisible()
})
