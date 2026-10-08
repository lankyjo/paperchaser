import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('first launch saves your business details and adds a deletable sample project of every document type', async ({ page }) => {
  await page.goto('/app')
  const setup = page.getByRole('region', { name: 'Set up your business' })
  await setup.getByLabel('Business name').fill('Northwind Studio')
  await setup.getByLabel('Email').fill('hello@northwind.test')
  await setup.getByLabel('Address').fill('12 Harbor Lane\nPortland')
  await setup.getByLabel('Payment details').fill('Harbor Credit Union\nIBAN DE89 3704 0044 0532 0130 00')
  await setup.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(setup).toHaveCount(0)

  await page.getByRole('link', { name: 'Sample: Acme coffee rebrand' }).click()
  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  const doc = page.locator('#document-root')
  await expect(doc).toContainText('Northwind Studio')
  await expect(doc).toContainText('SAMPLE-INV-01')
  await expect(doc).toContainText('IBAN DE89 3704 0044 0532 0130 00')

  await page.goto('/settings')
  await expect(page.getByRole('region', { name: 'Company profile' }).getByLabel('Business name')).toHaveValue('Northwind Studio')

  await page.goto('/app')
  await page.getByRole('link', { name: 'Sample: Acme coffee rebrand' }).click()
  await page.getByRole('button', { name: 'Delete project' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete project' }).click()
  await expect(page.getByRole('link', { name: 'Sample: Acme coffee rebrand' })).toHaveCount(0)
})

test('a new device can restore a backup from the welcome instead of setting up again', async ({ browser }) => {
  const old = await browser.newContext()
  await old.addInitScript(() => localStorage.setItem('paperchaser.welcomeSkipped', '1'))
  const page = await old.newPage()
  await page.goto('/app')
  await page.getByLabel('Search projects').fill('Harbour signage')
  await page.getByLabel('Search projects').press('Enter')
  await expect(page).toHaveURL(/\/documents\//)
  await page.goto('/settings')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download backup' }).click()
  const backup = readFileSync(await (await download).path())
  await old.close()

  const fresh = await browser.newContext()
  const device = await fresh.newPage()
  await device.goto('/app')
  await device.getByLabel('Backup file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backup })
  await expect(device.getByRole('link', { name: 'Harbour signage' })).toBeVisible()
  await device.reload()
  await expect(device.getByRole('region', { name: 'Set up your business' })).toHaveCount(0)
  await fresh.close()
})
