import { expect, test } from '@playwright/test'

test('first launch saves your business details and adds a deletable sample project of every document type', async ({ page }) => {
  await page.goto('/')
  const setup = page.getByRole('region', { name: 'Set up your business' })
  await setup.getByLabel('Business name').fill('Northwind Studio')
  await setup.getByLabel('Email').fill('hello@northwind.test')
  await setup.getByLabel('Address').fill('12 Harbor Lane\nPortland')
  await setup.getByLabel('Payment details (optional)').fill('Harbor Credit Union\nIBAN DE89 3704 0044 0532 0130 00')
  await setup.getByRole('button', { name: 'Save and add sample project' }).click()
  await expect(setup).toHaveCount(0)

  await page.getByRole('link', { name: 'Sample: Acme coffee rebrand' }).click()
  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  const doc = page.locator('#document-root')
  await expect(doc).toContainText('Northwind Studio')
  await expect(doc).toContainText('SAMPLE-INV-01')
  await expect(doc).toContainText('IBAN DE89 3704 0044 0532 0130 00')

  await page.goto('/settings')
  await expect(page.getByRole('region', { name: 'Company profile' }).getByLabel('Business name')).toHaveValue('Northwind Studio')

  await page.goto('/')
  await page.getByRole('link', { name: 'Sample: Acme coffee rebrand' }).click()
  await page.getByRole('button', { name: 'Delete project' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete project' }).click()
  await expect(page.getByRole('link', { name: 'Sample: Acme coffee rebrand' })).toHaveCount(0)
})
