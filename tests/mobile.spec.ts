import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

test('on mobile, the pipeline and document settings open as bottom sheets', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await expect(page.locator('#document-root')).toBeVisible()
  const guide = page.getByRole('dialog', { name: 'About the Invoice' })
  await guide.getByRole('button', { name: 'Got it' }).click()
  await expect(guide).toHaveCount(0)

  await page.getByRole('button', { name: 'Document settings' }).click()
  const settings = page.getByRole('dialog', { name: 'Document settings' })
  const gallery = settings.getByRole('radiogroup', { name: 'Template gallery' })
  await gallery.getByRole('radio', { name: 'Swiss' }).click()
  await expect(gallery.getByRole('radio', { name: 'Swiss' })).toHaveAttribute('aria-checked', 'true')
  await settings.getByRole('button', { name: 'Close' }).click()
  await expect(settings).toHaveCount(0)

  await page.getByRole('button', { name: 'Pipeline' }).click()
  await expect(page.getByRole('dialog', { name: 'Pipeline' }).getByRole('listitem', { name: 'Project Brief' })).toBeVisible()
})

test('resizing across the desktop breakpoint keeps the open document and the selected item', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.getByRole('button', { name: 'Add item' }).first().click()
  await page.getByRole('complementary', { name: 'Outline' }).getByText('Untitled', { exact: true }).click()
  const selected = page.locator('[aria-current="true"]')
  await expect(selected).toHaveCount(1)
  const url = page.url()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('#document-root')).toBeVisible()
  expect(page.url()).toBe(url)
  await expect(selected).toHaveCount(1)
})
