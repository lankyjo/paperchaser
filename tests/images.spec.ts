import { expect, test, type Page } from './helpers/test'

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
  await page.goto('/app')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/app')
  await page.getByRole('link', { name: 'Untitled project' }).click()
  await page.getByRole('button', { name: 'Start welcome' }).click()
  const pageRoot = page.locator('#document-root')

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

test('a drawn signature is trimmed and stored, with a blank client signature line', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/app')
  await page.getByRole('link', { name: 'Untitled project' }).click()
  await page.getByRole('button', { name: 'Start client agreement' }).click()
  const pageRoot = page.locator('#document-root')

  // Agreements start with a signature block, so the test uses that one.
  await expect(pageRoot.getByText('Client signature', { exact: true })).toBeVisible()
  await pageRoot.getByRole('button', { name: 'Draw signature' }).click()
  const pad = pageRoot.getByLabel('Signature drawing area')
  await pad.scrollIntoViewIfNeeded()
  const box = (await pad.boundingBox())!
  await page.mouse.move(box.x + 40, box.y + 60)
  await page.mouse.down()
  await page.mouse.move(box.x + 140, box.y + 30, { steps: 5 })
  await page.mouse.move(box.x + 200, box.y + 80, { steps: 5 })
  await page.mouse.up()
  await pageRoot.getByRole('button', { name: 'Use signature' }).click()

  const signature = pageRoot.getByRole('img', { name: /^Signature of/ })
  await expect(signature).toHaveAttribute('src', /^data:image\/png/)
  const { width, height } = await signature.evaluate((img: HTMLImageElement) => ({ width: img.naturalWidth, height: img.naturalHeight }))
  expect(width).toBeLessThan(600)
  expect(height).toBeLessThan(200)
})

test('a logo upload is stored as a compressed asset, rendered in the header, and survives pruning', async ({ page }) => {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await expect(page).toHaveURL(/\/documents\//)
  const docUrl = page.url()
  await page.locator('input[type="file"][accept*="image/png"]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG })
  const logo = page.locator('#document-root img.document-logo')
  await expect(logo).toHaveAttribute('src', /^data:image\/(webp|png)/)
  expect(await assetCount(page)).toBe(1)
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
  await page.goto(docUrl)
  await expect(logo).toHaveAttribute('src', /^data:image\/(webp|png)/)
  expect(await assetCount(page)).toBe(1)
})
