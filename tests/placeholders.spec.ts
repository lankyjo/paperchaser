import { expect, test } from './helpers/test'

test('sample placeholders are highlighted, survive editing around them, and disappear once replaced', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Untitled project' }).click()
  await page.getByRole('button', { name: 'Start welcome' }).click()
  const pageRoot = page.locator('#document-root')
  const chip = pageRoot.locator('.placeholder-node')
  await expect(chip).toHaveText('[Client name]')

  const intro = pageRoot.locator('[contenteditable="true"]:has(.placeholder-node)')
  await intro.click()
  await page.keyboard.press('End')
  await page.keyboard.type(' See you soon')
  await page.keyboard.press('Enter')
  await expect(pageRoot.getByText('See you soon')).toBeVisible()
  await expect(chip).toHaveCount(1)

  await pageRoot.locator('[contenteditable="true"]').filter({ hasText: 'See you soon' }).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('Welcome aboard, Acme.')
  await page.keyboard.press('Enter')
  await expect(chip).toHaveCount(0)
})
