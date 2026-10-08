import { expect, test } from './helpers/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {}
  })
})

test('a lead sends quotes only, becomes active on its first invoice once it has a client, and archives read-only', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search projects').fill('Pitch for Acme')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Pitch for Acme' }).click()
  await expect(page).toHaveURL(/\/projects\//)
  const projectUrl = page.url()

  await page.getByLabel('Status').selectOption('lead')
  await page.getByLabel('Prospect').fill('Acme Coffee')
  await page.getByLabel('Prospect').blur()
  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  await expect(page.getByRole('button', { name: 'Finalize and print' })).toBeDisabled()
  await expect(page.getByText('Add a client to this project')).toBeVisible()

  await page.goto(projectUrl)
  await page.getByLabel('New client for Pitch for Acme').fill('Acme Coffee')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  await page.getByRole('button', { name: 'Finalize and print' }).click()
  await page.getByRole('button', { name: /Finalize/ }).last().click()
  await expect(page.getByText('Sent · INV-0001')).toBeVisible()

  await page.goto(projectUrl)
  await expect(page.getByLabel('Status')).toHaveValue('active')
  await expect(page.getByRole('button', { name: 'Delete project' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByRole('button', { name: 'Start welcome' })).toBeDisabled()

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Pitch for Acme' })).toHaveCount(0)
  await page.getByLabel('Show archived').check()
  await page.getByLabel('Search projects').fill('acme coffee')
  await expect(page.getByRole('link', { name: 'Pitch for Acme' })).toBeVisible()
})

test('a project with nothing billed can be deleted', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Search projects').fill('Scrap me')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Scrap me' }).click()
  await page.getByRole('button', { name: 'Delete project' }).click()
  await page.getByRole('button', { name: 'Delete project' }).last().click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Scrap me' })).toHaveCount(0)
})
