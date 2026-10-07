import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

import { resolveTokens } from '../src/document/resolveTokens'

import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  blendColor,
  countPixelsInRange,
  cropY,
  diffFraction,
  normalize,
  rasterizePdf,
  type RGB,
} from './helpers/raster'

// Golden-image parity: preview, print projection and rasterized PDF of the torture fixture are pixel-diffed per template.

const FIXTURE = 'invoice-torture'
// Every template under parity test: one preview golden and PDF comparison each.
const TEMPLATES = ['blank', 'minimal', 'modern', 'corporate', 'freelancer', 'agency', 'creative'] as const
const HERE = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = path.join(HERE, 'fixtures')
const ARTIFACTS_DIR = path.join(HERE, 'artifacts')

// Per-template golden path: tests/fixtures/invoice-torture.{template}.preview.png.
function goldenPathFor(template: string): string {
  return path.join(FIXTURES_DIR, `invoice-torture.${template}.preview.png`)
}

// pixelmatch color threshold: absorbs pdfjs-vs-Chromium glyph anti-aliasing noise.
const DIFF_THRESHOLD = 0.3
// Preview vs print projection: measured 0.0000.
const PREVIEW_VS_PRINT_MAX_FRACTION = 0.01
// Print slice vs PDF page 1: measured 0.0306.
const PDF_PAGE1_MAX_FRACTION = 0.05
// Pages >= 2: thead strip cropped and a bounded break-shift search absorbs Chromium's row-boundary page breaks (measured 0.0367).
const PDF_PAGE_N_MAX_FRACTION = 0.06
const THEAD_STRIP_PX = 26
const MAX_BREAK_SHIFT_PX = 100
// Watermark geometry: fixed 64px, rotate(-30deg), opacity 0.15.
const WATERMARK_ALPHA = 0.15
const WATERMARK_TOL = 25
// Watermark band on PDF page 1: top:40% resolves against the ~1805px element, landing at rows ~600-880.
const WATERMARK_BAND = { y: 600, h: 260 }
const WATERMARK_FLOOR = 500
const WATERMARK_RATIO = 3

// Logo: solid #1d4ed8 mark in the company header (top ~12% of the page).
const LOGO_COLOR: RGB = { r: 29, g: 78, b: 216 }
const LOGO_TOL = 20
const LOGO_BAND = { y: 0, h: Math.round(0.12 * A4_HEIGHT_PX) }
// Logo pixel floor measured on a 48px logo; scaled by area since header presets render 48/40/24px logos.
const LOGO_FLOOR_48PX = 1000
// Header preset to rendered logo size in px (matches the preset components).
const LOGO_SIZE_BY_HEADER: Record<string, number> = {
  standard: 48,
  banner: 40,
  compact: 24,
  'standard-offset': 48,
}

function logoFloorFor(template: (typeof TEMPLATES)[number]): number {
  const size = LOGO_SIZE_BY_HEADER[resolveTokens(template).header.style] ?? 48
  return Math.round(LOGO_FLOOR_48PX * (size / 48) ** 2)
}

// Repeated-thead presence: row-rule color in the top strip of pages >= 2.
const THEAD_BORDER_TOL = 6
const THEAD_FLOOR = 30
// The thead row rule lands at y~46 on pages >= 2, so the presence window must reach past it.
const THEAD_CHECK_PX = 55

// Baseline: current preview vs committed golden (same renderer, so near 0).
const BASELINE_MAX_FRACTION = 0.005
const BASELINE_MIN_NONWHITE = 0.01

// Watermark blend target derived from each template's resolved accent over white, never a hardcoded constant.
function watermarkBlendFor(template: (typeof TEMPLATES)[number]): RGB {
  const resolved = resolveTokens(template)
  return blendColor(resolved.accent, WATERMARK_ALPHA, { r: 255, g: 255, b: 255 })
}

// Thead separator color follows each template's resolved rowRule token.
function theadBorderFor(template: (typeof TEMPLATES)[number]): RGB {
  const c = parseInt(resolveTokens(template).borders.rowRule.slice(1), 16)
  return { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255 }
}

function writeArtifacts(name: string, a: PNG, b: PNG, diff: PNG): void {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })
  fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}-a.png`), PNG.sync.write(a))
  fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}-b.png`), PNG.sync.write(b))
  fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}-diff.png`), PNG.sync.write(diff))
}

// Non-white (max channel < 250) pixel fraction, guards against a blank baseline.
function nonWhiteFraction(img: PNG): number {
  let n = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i] < 250 || img.data[i + 1] < 250 || img.data[i + 2] < 250) n++
  }
  return n / (img.width * img.height)
}

// Captures the torture fixture as preview, print projection and rasterized PDF pages.
async function captureFixture(page: Page, template = 'minimal') {
  await page.goto(`/?fixture=${FIXTURE}&template=${template}`)
  await page.waitForSelector('#print-root')

  // Await webfonts so page.pdf() never captures a fallback font before @font-face swaps in.
  await page.evaluate(() => document.fonts.ready)

  // The torture fixture's logo is an inline data-URL SVG — no network needed.
  const logo = page.locator('img.document-logo')
  await expect(logo).toBeVisible()
  await expect.poll(() => logo.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)

  const preview = normalize(PNG.sync.read(await page.locator('#print-root').screenshot()), A4_WIDTH_PX)
  await page.emulateMedia({ media: 'print' })
  const printShot = normalize(PNG.sync.read(await page.locator('#print-root').screenshot()), A4_WIDTH_PX)

  // page.pdf() must run under emulated print media; resetting to screen first changes the output.
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  const { pages, numPages } = await rasterizePdf(pdf, A4_WIDTH_PX)
  return { preview, printShot, pages, numPages }
}

test('fixture: preview matches print projection (all 7 templates)', async ({ page }) => {
  for (const template of TEMPLATES) {
    const { preview, printShot } = await captureFixture(page, template)
    const h = Math.min(preview.height, printShot.height)
    const { fraction, diff } = diffFraction(cropY(preview, 0, h), cropY(printShot, 0, h), DIFF_THRESHOLD)
    if (fraction >= PREVIEW_VS_PRINT_MAX_FRACTION) {
      writeArtifacts(`preview-vs-print-${template}`, preview, printShot, diff)
    }
    expect(fraction, `${template}: preview vs print (heights ${preview.height}/${printShot.height})`).toBeLessThan(
      PREVIEW_VS_PRINT_MAX_FRACTION,
    )
  }
})

test('fixture: print projection matches PDF per page (all 7 templates)', async ({ page }) => {
  for (const template of TEMPLATES) {
    const { printShot, pages } = await captureFixture(page, template)

    for (let i = 0; i < pages.length; i++) {
      const slice = cropY(printShot, i * A4_HEIGHT_PX, A4_HEIGHT_PX)
      const pdfPage = pages[i]
      const label = `${template} page ${i + 1}`

      if (i === 0) {
        // Page 1 aligns exactly with the slice top (dy = 0 — no shift search).
        const { fraction, diff } = diffFraction(slice, pdfPage, DIFF_THRESHOLD)
        if (fraction >= PDF_PAGE1_MAX_FRACTION) writeArtifacts(`print-vs-pdf-${label}`, slice, pdfPage, diff)
        expect(fraction, label).toBeLessThan(PDF_PAGE1_MAX_FRACTION)
      } else {
        // PDF repeats the thead and breaks at row boundaries, so crop the thead and search a bounded shift.
        const pdfBody = cropY(pdfPage, THEAD_STRIP_PX, A4_HEIGHT_PX)
        let best = { dy: 0, fraction: 1, diff: null as PNG | null }
        for (let dy = 0; dy <= MAX_BREAK_SHIFT_PX; dy += 2) {
          const { fraction, diff } = diffFraction(cropY(slice, dy, A4_HEIGHT_PX), pdfBody, DIFF_THRESHOLD)
          if (fraction < best.fraction) best = { dy, fraction, diff }
        }
        if (best.diff !== null && best.fraction >= PDF_PAGE_N_MAX_FRACTION) {
          writeArtifacts(`print-vs-pdf-${label}`, slice, pdfPage, best.diff)
        }
        expect(best.fraction, `${label} (thead strip excluded, break-shift dy=${best.dy})`).toBeLessThan(
          PDF_PAGE_N_MAX_FRACTION,
        )
      }
    }
  }
})

test('fixture: pdf paginates and carries watermark + logo bands (all 7 templates)', async ({ page }) => {
  for (const template of TEMPLATES) {
    const { pages, numPages } = await captureFixture(page, template)
    const blend = watermarkBlendFor(template)
    const theadBorder = theadBorderFor(template)
    // Blue-dominance AA filter only makes sense when the accent blend itself is blue.
    const blueDominant = blend.b - blend.r > 8

    // Pagination: the 18-item torture fixture is sized to span >= 2 pages.
    expect(numPages, `${template} pagination`).toBeGreaterThanOrEqual(2)

    // Chromium renders the absolutely-positioned watermark on page 1 only, so page 1 must dominate.
    const page1Watermark = countPixelsInRange(pages[0], WATERMARK_BAND, blend, WATERMARK_TOL, {
      blueDominant,
    })
    const otherPagesWatermark = pages
      .slice(1)
      .map((p) => countPixelsInRange(p, WATERMARK_BAND, blend, WATERMARK_TOL, { blueDominant }))
    const maxOther = Math.max(0, ...otherPagesWatermark)
    expect(
      page1Watermark,
      `${template} page 1 watermark blend pixels (accent ${blend.r},${blend.g},${blend.b}; band rows ${WATERMARK_BAND.y}-${WATERMARK_BAND.y + WATERMARK_BAND.h})`,
    ).toBeGreaterThanOrEqual(WATERMARK_FLOOR)
    expect(page1Watermark, `${template} page 1 watermark must exceed 3x max(pages >= 2)`).toBeGreaterThan(
      WATERMARK_RATIO * maxOther,
    )

    // Logo brand-color pixels survive into the PDF; floor scales with the header's logo size.
    const logoCount = countPixelsInRange(pages[0], LOGO_BAND, LOGO_COLOR, LOGO_TOL)
    expect(
      logoCount,
      `${template} page 1 logo brand-color pixels (top ${LOGO_BAND.h}px, floor ${logoFloorFor(template)})`,
    ).toBeGreaterThanOrEqual(logoFloorFor(template))

    // Each page >= 2 carries the repeated thead row-rule line (~46px down).
    for (let i = 1; i < pages.length; i++) {
      const borderPx = countPixelsInRange(pages[i], { y: 0, h: THEAD_CHECK_PX }, theadBorder, THEAD_BORDER_TOL)
      expect(borderPx, `${template} page ${i + 1} repeated-thead separator pixels`).toBeGreaterThanOrEqual(THEAD_FLOOR)
    }
  }
})

test('baseline: committed golden previews are sane and drift-free (all 7 templates)', async ({ page }) => {
  // One committed golden per template; the update flag rewrites, otherwise verifies.
  for (const template of TEMPLATES) {
    const { preview } = await captureFixture(page, template)
    const goldenPath = goldenPathFor(template)
    const update = process.env.UPDATE_BASELINES === '1'

    if (update) {
      // Explicit, reviewed golden update path; CI never sets this flag.
      fs.mkdirSync(FIXTURES_DIR, { recursive: true })
      fs.writeFileSync(goldenPath, PNG.sync.write(preview))
    } else if (!fs.existsSync(goldenPath)) {
      test.skip(true, `golden ${goldenPath} not committed yet — run UPDATE_BASELINES=1 after calibration`)
      return
    }

    const golden = PNG.sync.read(fs.readFileSync(goldenPath))

    // A blank or wrong-size golden must fail, or parity passes against a bad baseline forever.
    expect(golden.width, `${template} golden width must be 794px (A4@96dpi)`).toBe(A4_WIDTH_PX)
    expect(nonWhiteFraction(golden), `${template} golden must not be blank`).toBeGreaterThan(BASELINE_MIN_NONWHITE)

    // Drift guard: the current preview must match the committed golden.
    const h = Math.min(preview.height, golden.height)
    const { fraction, diff } = diffFraction(cropY(preview, 0, h), cropY(golden, 0, h), DIFF_THRESHOLD)
    if (fraction >= BASELINE_MAX_FRACTION) writeArtifacts(`baseline-drift-${template}`, preview, golden, diff)
    expect(fraction, `${template} current preview vs committed golden`).toBeLessThan(BASELINE_MAX_FRACTION)
  }
})

test('fixture: A5/A3 page sizes paginate with correct geometry (structural, D-07)', async ({ page }) => {
  // A5/A3 have no goldens, so assert geometry structurally; the A4 page count comes first for the A3 fewer-pages check.
  await page.goto(`/?fixture=${FIXTURE}`)
  await page.waitForSelector('#print-root')
  await page.evaluate(() => document.fonts.ready)
  await page.emulateMedia({ media: 'print' })
  const a4NumPages = (await rasterizePdf(await page.pdf({ format: 'A4', printBackground: true }), A4_WIDTH_PX)).numPages

  const sizes = [
    { size: 'A5' as const, format: 'A5', expectedWidth: Math.round((A4_WIDTH_PX * 148) / 210) },
    { size: 'A3' as const, format: 'A3', expectedWidth: Math.round((A4_WIDTH_PX * 297) / 210) },
  ]

  for (const { size, format, expectedWidth } of sizes) {
    await page.goto(`/?fixture=${FIXTURE}&size=${size.toLowerCase()}`)
    await page.waitForSelector('#print-root')
    await page.evaluate(() => document.fonts.ready)
    await page.emulateMedia({ media: 'print' })

    // 96dpi rasterization: the page PNG width IS the paper width in px.
    const pdf = await page.pdf({ format, printBackground: true })
    const { pages, numPages } = await rasterizePdf(pdf, A4_WIDTH_PX, { scale: 96 / 72 })

    expect(
      pages[0].width,
      `${size} page width ≈ ${expectedWidth}px (794·w/210 — format took effect)`,
    ).toBeGreaterThanOrEqual(expectedWidth - 2)
    expect(pages[0].width, `${size} page width ≈ ${expectedWidth}px (794·w/210)`).toBeLessThanOrEqual(
      expectedWidth + 2,
    )

    if (size === 'A5') {
      expect(numPages, `A5 pagination ≥ 2 on the torture fixture (edge-16)`).toBeGreaterThanOrEqual(2)
    } else {
      expect(numPages, `A3 fewer pages than A4 (edge-17)`).toBeLessThan(a4NumPages)
    }

    // Repeated thead strip on every page >= 2.
    const theadBorder = theadBorderFor('minimal')
    for (let i = 1; i < pages.length; i++) {
      const borderPx = countPixelsInRange(pages[i], { y: 0, h: THEAD_CHECK_PX }, theadBorder, THEAD_BORDER_TOL)
      expect(borderPx, `${size} page ${i + 1} repeated-thead separator pixels`).toBeGreaterThanOrEqual(THEAD_FLOOR)
    }

    // Watermark appears on exactly one page, whose placement varies by paper size, so assert per-page dominance.
    const blend = watermarkBlendFor('minimal')
    const blueDominant = blend.b - blend.r > 8
    const counts = pages.map((p) =>
      countPixelsInRange(p, { y: 0, h: p.height }, blend, WATERMARK_TOL, { blueDominant }),
    )
    const sorted = [...counts].sort((a, b) => b - a)
    expect(
      sorted[0],
      `${size} watermark blend pixels (per-page ${JSON.stringify(counts)})`,
    ).toBeGreaterThanOrEqual(WATERMARK_FLOOR)
    expect(sorted[0], `${size} watermark single-page occurrence (ADR 0002)`).toBeGreaterThan(
      WATERMARK_RATIO * (sorted[1] ?? 0),
    )
  }
})

test('fixture: print-preview dialog slices match the PDF pages (minimal, BUIL-10)', async ({ page }) => {
  // Dialog slices share the print-vs-PDF geometry; thresholds are 0.08 because Chromium mispaints tables with 3+ large document copies.
  const DIALOG_PAGE1_MAX_FRACTION = 0.08
  const DIALOG_PAGE_N_MAX_FRACTION = 0.08

  await page.goto(`/?fixture=${FIXTURE}`) // minimal (default template), A4 default
  await page.waitForSelector('#print-root')
  await page.evaluate(() => document.fonts.ready)

  await page.getByRole('button', { name: 'Print preview' }).click()
  const blocks = page.locator('.page-block')
  await expect(blocks).toHaveCount(2)

  // Capture the PDF under print media first (dialog is print:hidden), then return to screen for block shots.
  await page.emulateMedia({ media: 'print' })
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await page.emulateMedia({ media: 'screen' })
  const { pages, numPages } = await rasterizePdf(pdf, A4_WIDTH_PX)

  await expect(blocks).toHaveCount(numPages) // remounted after the print pass
  expect(await blocks.count(), 'dialog page-block count == PDF numPages (edge-20)').toBe(numPages)

  // The repeated thead must open block 1 (DOM-level check, unaffected by compositor artifacts).
  const block1Text = await blocks.nth(1).textContent()
  expect(block1Text, 'dialog page 2 repeats the table header (edge-23)').toContain('Item')

  for (let i = 0; i < numPages; i++) {
    // normalize() guards against any device-pixel-ratio drift; blocks are already 794px wide.
    const shot = normalize(PNG.sync.read(await blocks.nth(i).screenshot()), A4_WIDTH_PX)
    const pdfPage = pages[i]
    const label = `dialog page ${i + 1}`

    if (i === 0) {
      // Page 1 aligns exactly with the slice top (dy = 0, no shift search).
      const { fraction, diff } = diffFraction(shot, pdfPage, DIFF_THRESHOLD)
      if (fraction >= DIALOG_PAGE1_MAX_FRACTION) writeArtifacts(`dialog-vs-pdf-${label}`, shot, pdfPage, diff)
      expect(fraction, label).toBeLessThan(DIALOG_PAGE1_MAX_FRACTION)
    } else {
      // Same thead-strip exclusion and bounded break-shift search as the print-vs-PDF test.
      const pdfBody = cropY(pdfPage, THEAD_STRIP_PX, A4_HEIGHT_PX)
      let best = { dy: 0, fraction: 1, diff: null as PNG | null }
      for (let dy = 0; dy <= MAX_BREAK_SHIFT_PX; dy += 2) {
        const { fraction, diff } = diffFraction(cropY(shot, dy, A4_HEIGHT_PX), pdfBody, DIFF_THRESHOLD)
        if (fraction < best.fraction) best = { dy, fraction, diff }
      }
      if (best.diff !== null && best.fraction >= DIALOG_PAGE_N_MAX_FRACTION) {
        writeArtifacts(`dialog-vs-pdf-${label}`, shot, pdfPage, best.diff)
      }
      expect(best.fraction, `${label} (thead strip excluded, break-shift dy=${best.dy})`).toBeLessThan(
        DIALOG_PAGE_N_MAX_FRACTION,
      )
    }
  }
})

// Edit-mode #print-root (unfocused, no caret or chrome) matches the view-mode goldens.
test('fixture: edit-mode preview matches committed golden (all 7 templates, D-11)', async ({ page }) => {
  for (const template of TEMPLATES) {
    await page.goto(`/?fixture=${FIXTURE}&template=${template}`)
    await page.waitForSelector('#print-root')
    await page.evaluate(() => document.fonts.ready)

    // Blur any focused element to remove caret/focus ring before capture.
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    })

    const preview = normalize(
      PNG.sync.read(await page.locator('#print-root').screenshot()),
      A4_WIDTH_PX,
    )

    // Must match the committed golden; the single-paragraph rich-text wrapper is visually lossless.
    const goldenPath = goldenPathFor(template)
    if (!fs.existsSync(goldenPath)) {
      test.skip(true, `golden ${goldenPath} not committed yet — run UPDATE_BASELINES=1 after calibration`)
      return
    }
    const golden = PNG.sync.read(fs.readFileSync(goldenPath))

    const h = Math.min(preview.height, golden.height)
    const { fraction, diff } = diffFraction(cropY(preview, 0, h), cropY(golden, 0, h), DIFF_THRESHOLD)
    if (fraction >= BASELINE_MAX_FRACTION) {
      writeArtifacts(`edit-mode-drift-${template}`, preview, golden, diff)
    }
    expect(fraction, `${template} edit-mode preview vs committed golden`).toBeLessThan(BASELINE_MAX_FRACTION)
  }
})

// Print projection has no editing artifacts (no contentEditable, no chrome).
test('fixture: print projection has no editing artifacts (D-11)', async ({ page }) => {
  await page.goto(`/?fixture=${FIXTURE}`)
  await page.waitForSelector('#print-root')
  await page.evaluate(() => document.fonts.ready)
  await page.emulateMedia({ media: 'print' })

  // Structural assertion: no [contenteditable] elements in print media.
  const editableCount = await page.locator('#print-root [contenteditable]').count()
  expect(editableCount, 'print projection must have zero contentEditable elements').toBe(0)
})
