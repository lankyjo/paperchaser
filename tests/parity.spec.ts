import { expect, test, type Page } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  countPixelsInRange,
  cropY,
  diffFraction,
  normalize,
  rasterizePdf,
  type RGB,
} from './helpers/raster'

/* ========================================================================
 * Golden-image parity harness (plan 01-02) — ROADMAP SC3 proof.
 *
 * One fixture document, three captures, pairwise pixel diff:
 *   1. on-screen preview (screen media)
 *   2. print projection (emulated print media)
 *   3. the real PDF (page.pdf) rasterized per page via pdfjs-dist
 *
 * Capture note: projections are captured as the #print-root ELEMENT box, not
 * fullPage — the app-shell chrome (gray background, 24px padding) is part of
 * the page in screen media but must not be part of the parity contract, and
 * the element box is the only geometry that aligns with a 794px PDF page.
 *
 * Calibration (task 2, measured 2026-08-07): every constant below was set to
 * the tightest value that stays green across repeated runs, documented with
 * the measured distribution that motivated it. The pixelmatch color
 * threshold absorbs pdfjs-vs-Chromium glyph anti-aliasing (a DIFFERENT
 * rasterizer rendering the same embedded fonts — not content drift).
 * ===================================================================== */

const FIXTURE = 'invoice-torture'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = path.join(HERE, 'fixtures')
const GOLDEN_PATH = path.join(FIXTURES_DIR, 'invoice-torture.preview.png')
const ARTIFACTS_DIR = path.join(HERE, 'artifacts')

/** pixelmatch color threshold: absorbs cross-rasterizer glyph AA noise. */
const DIFF_THRESHOLD = 0.3
/** Group 1: preview vs print projection — measured 0.0000. */
const PREVIEW_VS_PRINT_MAX_FRACTION = 0.01
/** Group 2, page 1: print slice vs PDF page 1 — measured 0.0306. */
const PDF_PAGE1_MAX_FRACTION = 0.05
/**
 * Group 2, pages >= 2: the repeated thead strip is cropped off the PDF page
 * and a bounded row-boundary break-shift search aligns the slice — measured
 * 0.0367. The shift absorbs Chromium's `break-inside: avoid` page-break
 * placement (a paged-media feature absent from the continuous projection);
 * page 1 (dy=0, no search) still catches any global layout drift.
 */
const PDF_PAGE_N_MAX_FRACTION = 0.06
const THEAD_STRIP_PX = 26
const MAX_BREAK_SHIFT_PX = 100

/** Watermark: fixture brand #1d4ed8 at opacity 0.15 over white ≈ (221,228,249). */
const WATERMARK_BLEND: RGB = { r: 221, g: 228, b: 249 }
const WATERMARK_TOL = 25
/**
 * Watermark band on the rasterized PDF page. top:40% resolves against the
 * ELEMENT height (~1805px), not the page height, so the measured landing on
 * page 1 is rows ~600-880 — the calibrated band below covers it (measured
 * distribution, task 2). Counts require blue dominance to reject gray AA.
 */
const WATERMARK_BAND = { y: 600, h: 260 }
const WATERMARK_FLOOR = 500
const WATERMARK_RATIO = 3

/** Logo: solid #1d4ed8 mark in the company header (top ~12% of the page). */
const LOGO_COLOR: RGB = { r: 29, g: 78, b: 216 }
const LOGO_TOL = 20
const LOGO_BAND = { y: 0, h: Math.round(0.12 * A4_HEIGHT_PX) }
const LOGO_FLOOR = 1000

/** Repeated-thead presence: border-separator color (#e5e7eb) in the top strip of pages >= 2. */
const THEAD_BORDER: RGB = { r: 229, g: 231, b: 235 }
const THEAD_BORDER_TOL = 6
const THEAD_FLOOR = 30

/** Baseline: current preview vs committed golden (same renderer → near 0). */
const BASELINE_MAX_FRACTION = 0.005
const BASELINE_MIN_NONWHITE = 0.01

function writeArtifacts(name: string, a: PNG, b: PNG, diff: PNG): void {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })
  fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}-a.png`), PNG.sync.write(a))
  fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}-b.png`), PNG.sync.write(b))
  fs.writeFileSync(path.join(ARTIFACTS_DIR, `${name}-diff.png`), PNG.sync.write(diff))
}

/** Non-white (max channel < 250) pixel fraction — blank-baseline guard. */
function nonWhiteFraction(img: PNG): number {
  let n = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i] < 250 || img.data[i + 1] < 250 || img.data[i + 2] < 250) n++
  }
  return n / (img.width * img.height)
}

/** The torture fixture's three captures + per-page rasterization. */
async function captureFixture(page: Page) {
  await page.goto(`/?fixture=${FIXTURE}`)
  await page.waitForSelector('#print-root')

  // The torture fixture's logo is an inline data-URL SVG — no network needed.
  const logo = page.locator('img.document-logo')
  await expect(logo).toBeVisible()
  await expect.poll(() => logo.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)

  const preview = normalize(PNG.sync.read(await page.locator('#print-root').screenshot()), A4_WIDTH_PX)
  await page.emulateMedia({ media: 'print' })
  const printShot = normalize(PNG.sync.read(await page.locator('#print-root').screenshot()), A4_WIDTH_PX)

  // NOTE: page.pdf() must run while print media is still emulated — resetting
  // to screen first changes the printed output (measured 0.078 vs 0.031 diff
  // fraction, plan 01-02 calibration). Each test uses a fresh page, so the
  // emulated media state never leaks across tests.
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  const { pages, numPages } = await rasterizePdf(pdf, A4_WIDTH_PX)
  return { preview, printShot, pages, numPages }
}

test('fixture: preview matches print projection', async ({ page }) => {
  const { preview, printShot } = await captureFixture(page)
  const h = Math.min(preview.height, printShot.height)
  const { fraction, diff } = diffFraction(cropY(preview, 0, h), cropY(printShot, 0, h), DIFF_THRESHOLD)
  if (fraction >= PREVIEW_VS_PRINT_MAX_FRACTION) {
    writeArtifacts('preview-vs-print', preview, printShot, diff)
  }
  expect(fraction, `preview vs print projection (heights ${preview.height}/${printShot.height})`).toBeLessThan(
    PREVIEW_VS_PRINT_MAX_FRACTION,
  )
})

test('fixture: print projection matches PDF per page', async ({ page }) => {
  const { printShot, pages } = await captureFixture(page)

  for (let i = 0; i < pages.length; i++) {
    const slice = cropY(printShot, i * A4_HEIGHT_PX, A4_HEIGHT_PX)
    const pdfPage = pages[i]
    const label = `page ${i + 1}`

    if (i === 0) {
      // Page 1 aligns exactly with the slice top (dy = 0 — no shift search).
      const { fraction, diff } = diffFraction(slice, pdfPage, DIFF_THRESHOLD)
      if (fraction >= PDF_PAGE1_MAX_FRACTION) writeArtifacts(`print-vs-pdf-${label}`, slice, pdfPage, diff)
      expect(fraction, label).toBeLessThan(PDF_PAGE1_MAX_FRACTION)
    } else {
      // Pages >= 2: the PDF repeats the thead (paged-media) and places the
      // page break at a row boundary (break-inside: avoid) — neither exists in
      // the continuous projection. Crop the thead strip off the PDF page and
      // search the bounded break shift that aligns the slice.
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
})

test('fixture: pdf paginates and carries watermark + logo bands', async ({ page }) => {
  const { pages, numPages } = await captureFixture(page)

  // Pagination: the 18-item torture fixture is sized to span >= 2 pages.
  expect(numPages).toBeGreaterThanOrEqual(2)

  // Watermark: renders on PDF page 1 above a calibrated floor and above
  // 3x the max count on pages >= 2 (Chromium does NOT repeat a single
  // absolutely-positioned element across paginated pages — the measured
  // first-page-only behavior ADR 0002 records).
  const page1Watermark = countPixelsInRange(pages[0], WATERMARK_BAND, WATERMARK_BLEND, WATERMARK_TOL, {
    blueDominant: true,
  })
  const otherPagesWatermark = pages
    .slice(1)
    .map((p) => countPixelsInRange(p, WATERMARK_BAND, WATERMARK_BLEND, WATERMARK_TOL, { blueDominant: true }))
  const maxOther = Math.max(0, ...otherPagesWatermark)
  expect(page1Watermark, `page 1 watermark blend pixels (band rows ${WATERMARK_BAND.y}-${WATERMARK_BAND.y + WATERMARK_BAND.h})`).toBeGreaterThanOrEqual(
    WATERMARK_FLOOR,
  )
  expect(page1Watermark, 'page 1 watermark must exceed 3x max(pages >= 2)').toBeGreaterThan(WATERMARK_RATIO * maxOther)

  // Logo: the solid brand-color mark survives into the PDF (deterministic population).
  const logoCount = countPixelsInRange(pages[0], LOGO_BAND, LOGO_COLOR, LOGO_TOL)
  expect(logoCount, `page 1 logo brand-color pixels (top ${LOGO_BAND.h}px)`).toBeGreaterThanOrEqual(LOGO_FLOOR)

  // Repeated thead: each page >= 2 carries the header separator strip.
  for (let i = 1; i < pages.length; i++) {
    const borderPx = countPixelsInRange(pages[i], { y: 0, h: THEAD_STRIP_PX }, THEAD_BORDER, THEAD_BORDER_TOL)
    expect(borderPx, `page ${i + 1} repeated-thead separator pixels`).toBeGreaterThanOrEqual(THEAD_FLOOR)
  }
})

test('baseline: committed golden preview is sane and drift-free', async ({ page }) => {
  const { preview } = await captureFixture(page)
  const update = process.env.UPDATE_BASELINES === '1'

  if (update) {
    // The explicit, reviewed update path (Pitfall 5): writes the golden.
    // CI never sets this flag — plan 01-03 enforces it.
    fs.mkdirSync(FIXTURES_DIR, { recursive: true })
    fs.writeFileSync(GOLDEN_PATH, PNG.sync.write(preview))
  } else if (!fs.existsSync(GOLDEN_PATH)) {
    test.skip(true, `golden ${GOLDEN_PATH} not committed yet — run UPDATE_BASELINES=1 after calibration`)
    return
  }

  const golden = PNG.sync.read(fs.readFileSync(GOLDEN_PATH))

  // Baseline sanity (Pitfall 5): a blank or wrong-size golden must fail the
  // suite every run, or parity "passes" against a wrong baseline forever.
  expect(golden.width, 'golden width must be 794px (A4@96dpi)').toBe(A4_WIDTH_PX)
  expect(nonWhiteFraction(golden), 'golden must not be blank').toBeGreaterThan(BASELINE_MIN_NONWHITE)

  // Drift guard: the current preview must match the committed golden.
  const h = Math.min(preview.height, golden.height)
  const { fraction, diff } = diffFraction(cropY(preview, 0, h), cropY(golden, 0, h), DIFF_THRESHOLD)
  if (fraction >= BASELINE_MAX_FRACTION) writeArtifacts('baseline-drift', preview, golden, diff)
  expect(fraction, 'current preview vs committed golden').toBeLessThan(BASELINE_MAX_FRACTION)
})
