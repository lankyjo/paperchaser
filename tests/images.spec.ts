import { expect, test, type Page } from '@playwright/test'

// 2x2 red PNG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP4z8DwHwyBNAMDA8N/AACfAQn/TkY1NQAAAABJRU5ErkJggg==', 'base64')
const EVIL_SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>window.__pwned = true</script><rect width="10" height="10" fill="blue"/></svg>')

const assetCount = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('paperchaser')
        open.onsuccess = () => {
          const req = open.result.transaction('assets').objectStore('assets').count()
          req.onsuccess = () => resolve(req.result)
        }
      }),
  )

test('images upload compressed, are stored once, and uploaded SVG scripts never run', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Untitled project' }).click()
  await page.getByRole('button', { name: 'Start welcome' }).click()
  const pageRoot = page.locator('#print-root')

  await page.getByRole('button', { name: 'Add image' }).click()
  await pageRoot.getByLabel('Upload image').setInputFiles({ name: 'red.png', mimeType: 'image/png', buffer: PNG })
  await expect(pageRoot.locator('figure img')).toHaveAttribute('src', /^data:image\/(webp|png)/)

  await page.getByRole('button', { name: 'Add image' }).click()
  await pageRoot.getByLabel('Upload image').last().setInputFiles({ name: 'red.png', mimeType: 'image/png', buffer: PNG })
  await expect(pageRoot.locator('figure img')).toHaveCount(2)
  expect(await assetCount(page)).toBe(1)

  await page.getByRole('button', { name: 'Add image' }).click()
  await pageRoot.getByLabel('Upload image').last().setInputFiles({ name: 'evil.svg', mimeType: 'image/svg+xml', buffer: EVIL_SVG })
  await expect(pageRoot.locator('figure img')).toHaveCount(3)
  expect(await page.evaluate(() => (window as { __pwned?: boolean }).__pwned)).toBeUndefined()
  await expect(pageRoot.locator('figure img').last()).toHaveAttribute('src', /^data:image\/(webp|png)/)
})
