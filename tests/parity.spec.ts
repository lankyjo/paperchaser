import { expect, test, type Page } from './helpers/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

import { resolveTokens } from '../src/document/resolveTokens'
import { TEMPLATE_REGISTRY } from '../src/document/tokens'
import type { TemplateId } from '../src/document/types'

import { A4_WIDTH_PX, blendColor, countPixelsInRange, cropY, diffFraction, normalize, rasterizePdf, type RGB } from './helpers/raster'

// Golden-image parity: the preview pages, the printed pages and the rasterized PDF of the torture fixture must agree page for page.

const FIXTURE = 'invoice-torture'
// Each test loops over every template, so it needs more than the default 30s.
test.describe.configure({ timeout: 180_000 })
// Large enough that the workspace's canvas panel shows a whole page without scrolling.
test.use({ viewport: { width: 1600, height: 2400 } })
const TEMPLATES = Object.keys(TEMPLATE_REGISTRY) as TemplateId[]
const HERE = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = path.join(HERE, 'fixtures')
const ARTIFACTS_DIR = path.join(HERE, 'artifacts')

// pixelmatch color threshold: absorbs pdfjs-vs-Chromium glyph anti-aliasing noise.
const DIFF_THRESHOLD = 0.3
// Preview page vs PDF page; the remaining difference is cross-rasterizer glyph noise.
const PAGE_MAX_FRACTION = 0.05
// Editor canvas vs printed page 1, over the top of the page that no break can affect; the centered canvas adds sub-pixel glyph noise.
const EDITOR_MAX_FRACTION = 0.02
const EDITOR_COMPARE_PX = 700
const BASELINE_MAX_FRACTION = 0.005
const BASELINE_MIN_NONWHITE = 0.01
const WATERMARK_ALPHA = 0.15
const WATERMARK_TOL = 25
const WATERMARK_FLOOR = 500
const LOGO_COLOR: RGB = { r: 29, g: 78, b: 216 }
const LOGO_TOL = 20
const LOGO_FLOOR = 150

function writeArtifacts(name: string, a: PNG, b: PNG, diff: PNG): void {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })
  fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}-a.png`), PNG.sync.write(a))
  fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}-b.png`), PNG.sync.write(b))
  fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}-diff.png`), PNG.sync.write(diff))
}

function expectSimilar(a: PNG, b: PNG, max: number, label: string): void {
  const { fraction, diff } = diffFraction(a, b, DIFF_THRESHOLD)
  if (fraction >= max) writeArtifacts(label.replaceAll(' ', '-'), a, b, diff)
  expect(fraction, label).toBeLessThan(max)
}

function nonWhiteFraction(img: PNG): number {
  let n = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i] < 250 || img.data[i + 1] < 250 || img.data[i + 2] < 250) n++
  }
  return n / (img.width * img.height)
}

async function openFixture(page: Page, query: string): Promise<void> {
  await page.goto(`/app?fixture=${query}`)
  await page.waitForSelector('#document-root')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('#print-root .document-page').first()).toBeAttached()
}

// Screenshots every printed page as the print stylesheet lays it out.
async function printedPages(page: Page): Promise<PNG[]> {
  await page.emulateMedia({ media: 'print' })
  const pages = page.locator('#print-root .document-page')
  const shots: PNG[] = []
  for (let i = 0; i < (await pages.count()); i++) shots.push(normalize(PNG.sync.read(await pages.nth(i).screenshot()), A4_WIDTH_PX))
  await page.emulateMedia({ media: 'screen' })
  return shots
}

// Text of each page in the print-preview dialog.
async function previewPageTexts(page: Page): Promise<string[]> {
  await page.getByRole('button', { name: 'Print preview' }).click()
  const blocks = page.locator('.page-block')
  await expect(blocks.first()).toBeVisible()
  const texts = await blocks.allTextContents()
  await page.keyboard.press('Escape')
  return texts
}

// Prints to PDF with the page size the document asks for, rasterized at 96dpi so widths are CSS px.
async function printedPdf(page: Page, opts: { scale?: number } = {}) {
  await page.emulateMedia({ media: 'print' })
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true })
  await page.emulateMedia({ media: 'screen' })
  return rasterizePdf(pdf, A4_WIDTH_PX, opts)
}

test('printed pages match the PDF page for page, and the preview shows the same pages', async ({ page }) => {
  for (const template of TEMPLATES) {
    await openFixture(page, `${FIXTURE}&template=${template}`)
    const printed = await printedPages(page)
    const { pages } = await printedPdf(page)
    expect(pages.length, `${template} spans at least two pages`).toBeGreaterThanOrEqual(2)
    expect(printed.length, `${template} app and PDF page counts`).toBe(pages.length)
    pages.forEach((pdfPage, i) => expectSimilar(printed[i], pdfPage, PAGE_MAX_FRACTION, `${template} page ${i + 1} printed vs pdf`))
    expect(await previewPageTexts(page), `${template} preview pages`).toEqual(await page.locator('#print-root .document-page').allTextContents())
  }
})

test('every printed page carries the watermark; page 1 the logo; later pages repeat the table header', async ({ page }) => {
  for (const template of TEMPLATES) {
    await openFixture(page, `${FIXTURE}&template=${template}`)
    const { pages } = await printedPdf(page)
    const fill = parseInt(resolveTokens(template).palette.fill.slice(1), 16)
    const blend = blendColor(resolveTokens(template).accent, WATERMARK_ALPHA, { r: (fill >> 16) & 255, g: (fill >> 8) & 255, b: fill & 255 })
    pages.forEach((p, i) => {
      const count = countPixelsInRange(p, { y: 0, h: p.height }, blend, WATERMARK_TOL, { blueDominant: blend.b - blend.r > 8 })
      expect(count, `${template} page ${i + 1} watermark pixels`).toBeGreaterThanOrEqual(WATERMARK_FLOOR)
    })
    const logo = countPixelsInRange(pages[0], { y: 0, h: 200 }, LOGO_COLOR, LOGO_TOL)
    expect(logo, `${template} page 1 logo pixels`).toBeGreaterThanOrEqual(LOGO_FLOOR)
    await expect(page.locator('#print-root .document-page').nth(1).locator('thead')).toContainText('Item')
  }
})

test('the editor canvas looks like printed page 1', async ({ page }) => {
  for (const template of TEMPLATES) {
    await openFixture(page, `${FIXTURE}&template=${template}`)
    // Clip to the page's on-screen box; an element screenshot inside the scrolled canvas panel lands a few pixels off.
    const box = await page.locator('#document-root').boundingBox()
    const clip = box && { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
    const editor = normalize(PNG.sync.read(await page.screenshot({ clip: clip ?? undefined })), A4_WIDTH_PX)
    const [first] = await printedPages(page)
    expectSimilar(cropY(editor, 0, EDITOR_COMPARE_PX), cropY(first, 0, EDITOR_COMPARE_PX), EDITOR_MAX_FRACTION, `${template} editor vs page 1`)
  }
})

test('committed golden of page 1 is sane and drift-free', async ({ page }) => {
  for (const template of TEMPLATES) {
    await openFixture(page, `${FIXTURE}&template=${template}`)
    const [first] = await printedPages(page)
    const goldenPath = path.join(FIXTURES_DIR, `invoice-torture.${template}.preview.png`)
    // Explicit, reviewed golden update path; CI never sets this flag.
    if (process.env.UPDATE_BASELINES === '1') fs.writeFileSync(goldenPath, PNG.sync.write(first))
    const golden = PNG.sync.read(fs.readFileSync(goldenPath))
    expect(golden.width, `${template} golden width`).toBe(A4_WIDTH_PX)
    expect(nonWhiteFraction(golden), `${template} golden must not be blank`).toBeGreaterThan(BASELINE_MIN_NONWHITE)
    expectSimilar(first, golden, BASELINE_MAX_FRACTION, `${template} page 1 vs golden`)
  }
})

test('Letter, A5 and A3 print on their own paper with one PDF page per app page', async ({ page }) => {
  await openFixture(page, FIXTURE)
  const a4Pages = (await printedPdf(page)).numPages
  const sizes = [
    { size: 'letter', width: 816 },
    { size: 'a5', width: Math.round((A4_WIDTH_PX * 148) / 210) },
    { size: 'a3', width: Math.round((A4_WIDTH_PX * 297) / 210) },
  ]
  for (const { size, width } of sizes) {
    await openFixture(page, `${FIXTURE}&size=${size}`)
    const appPages = await page.locator('#print-root .document-page').count()
    const { pages, numPages } = await printedPdf(page, { scale: 96 / 72 })
    expect(Math.abs(pages[0].width - width), `${size} paper width ${pages[0].width} vs ${width}`).toBeLessThanOrEqual(2)
    expect(numPages, `${size} PDF pages equal app pages`).toBe(appPages)
    if (size === 'a3') expect(numPages, 'A3 needs fewer pages than A4').toBeLessThan(a4Pages)
    if (size === 'a5') expect(numPages, 'A5 needs more pages than A4').toBeGreaterThan(a4Pages)
  }
})

test('printed pages have no editing artifacts', async ({ page }) => {
  await openFixture(page, FIXTURE)
  await expect(page.locator('#print-root [contenteditable]')).toHaveCount(0)
})

test('a section taller than a page warns that it will be cut off', async ({ page }) => {
  await openFixture(page, 'invoice-oversized')
  await expect(page.getByRole('alert').filter({ hasText: 'taller than one page' })).toBeVisible()
})
