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

/* ========================================================================
 * Golden-image parity harness (plan 01-02) — ROADMAP SC3 proof, extended by
 * plan 04 (D-06) to loop ALL 7 templates × the torture fixture.
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
/** D-06: every template under parity test — 7 preview goldens + PDF comparisons. */
const TEMPLATES = ['blank', 'minimal', 'modern', 'corporate', 'freelancer', 'agency', 'creative'] as const
const HERE = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = path.join(HERE, 'fixtures')
const ARTIFACTS_DIR = path.join(HERE, 'artifacts')

/** Per-template golden path: tests/fixtures/invoice-torture.{template}.preview.png (D-06). */
function goldenPathFor(template: string): string {
  return path.join(FIXTURES_DIR, `invoice-torture.${template}.preview.png`)
}

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
/** Watermark geometry (D-04): fixed 64px / rotate(-30°) / opacity 0.15. */
const WATERMARK_ALPHA = 0.15
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
/**
 * LOGO_FLOOR was calibrated on the Minimal 48px Standard-header logo (plan
 * 01-02). The header presets render the mark at different sizes (Standard /
 * standard-offset 48px, Banner 40px, Compact 24px), so the floor must scale
 * with the resolved header style's logo area — the same Pitfall-1 principle
 * as the watermark blend: a fixed constant fails every non-48px header
 * (measured: Blank's 24px Compact logo lands ~483 pixels vs floor 1000).
 */
const LOGO_FLOOR_48PX = 1000
/** Header preset → rendered logo size in px (matches the preset components). */
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

/** Repeated-thead presence: border-separator color (the row rule) in the top strip of pages >= 2. */
const THEAD_BORDER_TOL = 6
const THEAD_FLOOR = 30
/**
 * Presence-check window for the repeated thead. The thead row is ~30px tall
 * plus a fragmentainer offset (measured: the full-width row-rule line lands at
 * y≈46 on pages >= 2 for every template), so the window must reach it — the
 * original 26px strip only caught Minimal's gray-text AA coincidence, not the
 * actual border line (measured: Blank scores 6 px inside 26px vs 688 at 50px).
 * THEAD_STRIP_PX (26, the print-vs-PDF crop) stays untouched.
 */
const THEAD_CHECK_PX = 55

/** Baseline: current preview vs committed golden (same renderer → near 0). */
const BASELINE_MAX_FRACTION = 0.005
const BASELINE_MIN_NONWHITE = 0.01

/**
 * D-04 harness: the watermark band target is DERIVED from each template's
 * RESOLVED accent (the same resolver the app uses — never a hardcoded blend
 * constant, Pitfall 1). The white background is the page's BRND-07 white.
 */
function watermarkBlendFor(template: (typeof TEMPLATES)[number]): RGB {
  const resolved = resolveTokens(template)
  return blendColor(resolved.accent, WATERMARK_ALPHA, { r: 255, g: 255, b: 255 })
}

/**
 * Pitfall 1 applied to the repeated-thead check too: the thead separator is
 * drawn with each template's rowRule token, so the band color follows the
 * resolved row rule per template — a hardcoded #e5e7eb would fail every
 * template whose row rule differs (corporate #d1d5db, agency #f3f4f6, ...).
 */
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

/** Non-white (max channel < 250) pixel fraction — blank-baseline guard. */
function nonWhiteFraction(img: PNG): number {
  let n = 0
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i] < 250 || img.data[i + 1] < 250 || img.data[i + 2] < 250) n++
  }
  return n / (img.width * img.height)
}

/** The torture fixture's three captures + per-page rasterization. */
async function captureFixture(page: Page, template = 'minimal') {
  await page.goto(`/?fixture=${FIXTURE}&template=${template}`)
  await page.waitForSelector('#print-root')

  // Pitfall 4: webfont determinism — page.pdf() can capture before @font-face
  // swap finishes, which would render a fallback font in the PDF only. Await
  // fonts.ready once, before any screenshot/PDF capture (edge-26, all templates).
  await page.evaluate(() => document.fonts.ready)

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
  }
})

test('fixture: pdf paginates and carries watermark + logo bands (all 7 templates)', async ({ page }) => {
  for (const template of TEMPLATES) {
    const { pages, numPages } = await captureFixture(page, template)
    const blend = watermarkBlendFor(template)
    const theadBorder = theadBorderFor(template)
    // The blueDominant AA-rejection filter only applies when the derived
    // watermark blend is itself blue-dominant (b > r) — a warm accent
    // (freelancer orange) yields a warm blend where blue-dominance is
    // meaningless and would reject the real watermark pixels.
    const blueDominant = blend.b - blend.r > 8

    // Pagination: the 18-item torture fixture is sized to span >= 2 pages.
    expect(numPages, `${template} pagination`).toBeGreaterThanOrEqual(2)

    // Watermark: renders on PDF page 1 above a calibrated floor and above
    // 3x the max count on pages >= 2 (Chromium does NOT repeat a single
    // absolutely-positioned element across paginated pages — the measured
    // first-page-only behavior ADR 0002 records). Blend target is the
    // per-template resolved accent (D-04), never a hardcoded constant.
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

    // Logo: the solid brand-color mark survives into the PDF (deterministic
    // population). Floor scales with the header preset's logo size (48/40/24px).
    const logoCount = countPixelsInRange(pages[0], LOGO_BAND, LOGO_COLOR, LOGO_TOL)
    expect(
      logoCount,
      `${template} page 1 logo brand-color pixels (top ${LOGO_BAND.h}px, floor ${logoFloorFor(template)})`,
    ).toBeGreaterThanOrEqual(logoFloorFor(template))

    // Repeated thead: each page >= 2 carries the header separator strip (the
    // full-width row-rule line lands ~46px down — THEAD_CHECK_PX reaches it).
    for (let i = 1; i < pages.length; i++) {
      const borderPx = countPixelsInRange(pages[i], { y: 0, h: THEAD_CHECK_PX }, theadBorder, THEAD_BORDER_TOL)
      expect(borderPx, `${template} page ${i + 1} repeated-thead separator pixels`).toBeGreaterThanOrEqual(THEAD_FLOOR)
    }
  }
})

test('baseline: committed golden previews are sane and drift-free (all 7 templates)', async ({ page }) => {
  // D-06: one committed golden per template; the loop writes + verifies each.
  for (const template of TEMPLATES) {
    const { preview } = await captureFixture(page, template)
    const goldenPath = goldenPathFor(template)
    const update = process.env.UPDATE_BASELINES === '1'

    if (update) {
      // The explicit, reviewed update path (Pitfall 5): writes the golden.
      // CI never sets this flag — plan 01-03 enforces it.
      fs.mkdirSync(FIXTURES_DIR, { recursive: true })
      fs.writeFileSync(goldenPath, PNG.sync.write(preview))
    } else if (!fs.existsSync(goldenPath)) {
      test.skip(true, `golden ${goldenPath} not committed yet — run UPDATE_BASELINES=1 after calibration`)
      return
    }

    const golden = PNG.sync.read(fs.readFileSync(goldenPath))

    // Baseline sanity (Pitfall 5): a blank or wrong-size golden must fail the
    // suite every run, or parity "passes" against a wrong baseline forever.
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
  // D-07: A5/A3 get NO golden baselines — structural assertions only, through
  // the same ≥2-page torture path. Per format:
  //  - Width smoke (RESEARCH Open Question 2 RESOLVED): rasterizing at 96dpi
  //    (scale 96/72 — raster.ts) makes the PNG width the page width in CSS px;
  //    it must equal 794·(w/210) — A5 ≈ 560, A3 ≈ 1123 — proving
  //    page.pdf({ format }) took effect (format wins over CSS @page size by
  //    default, playwright-core preferCSSPageSize=false).
  //  - Pagination: A5 renders ≥ 2 pages (edge-16); A3 renders FEWER pages than
  //    A4 for the same fixture (edge-17 — bigger page, same content).
  //  - Repeated thead on pages ≥ 2 (edge-23) and single-occurrence watermark
  //    (edge-22, ADR 0002) under the SAME break rules (PDF-03) — the bands
  //    are DERIVED from the measured continuous element (Pitfall 1: the fixed
  //    A4-calibrated bands do not map to other sizes).
  // A4 baseline count for edge-17 (same fixture, same capture path) — must
  // complete BEFORE the loop navigates the shared page for A5/A3.
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

    // edge-23: repeated thead strip on every page ≥ 2 (border color follows
    // the resolved rowRule — theadBorderFor('minimal'), Pitfall 1).
    const theadBorder = theadBorderFor('minimal')
    for (let i = 1; i < pages.length; i++) {
      const borderPx = countPixelsInRange(pages[i], { y: 0, h: THEAD_CHECK_PX }, theadBorder, THEAD_BORDER_TOL)
      expect(borderPx, `${size} page ${i + 1} repeated-thead separator pixels`).toBeGreaterThanOrEqual(THEAD_FLOOR)
    }

    // edge-22 (size-agnostic form): the watermark is ONE absolutely-positioned
    // element (top:40%), and Chromium does NOT repeat it across paginated
    // pages (ADR 0002). Its exact paged-media placement varies with page size
    // (measured: A4 sits inside page 1; A5 straddles the 1|2 boundary — 32px
    // sliver on page 1, 2528px bulk on page 2), so a fixed band cannot locate
    // it across sizes. The robust assertion is per-page DOMINANCE: exactly one
    // page carries the accent-blend pixels above the calibrated floor, and it
    // exceeds WATERMARK_RATIO × every other page. Blend target = the derived
    // resolved-accent blend (Pitfall 1, watermarkBlendFor — same as the A4
    // test; blueDominant rejects gray AA everywhere else).
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
  // RESEARCH A1 + Pitfall 5 (accept-and-calibrate, never reimplement
  // fragmentation): the dialog's measure-and-slice blocks are the SAME
  // cropY(printShot, i·A4_HEIGHT_PX, A4_HEIGHT_PX) geometry the print-vs-PDF
  // test diffs, so dialog page i ≈ PDF page i (transitive through the print
  // projection: preview == print < 0.01 and print == PDF < 0.05/0.06, both
  // proven per template).
  //
  // CALIBRATION (measured 2026-08-09, plan 03-05 Task 3): Chromium's
  // compositor mispaints tables in pages carrying 3+ large (794×1123+)
  // document copies — the canvas + measure container + N block copies. The
  // artifact is a bounded, DETERMINISTIC row shift (~+15px on a mid-table
  // band; reproduced in headless AND headed/swiftshader; identical fraction
  // across repeated runs) — rows shift/misalign below ~row 488. Measured
  // dialog-vs-PDF: page 1 = 0.0555 (dy=0), page 2 = 0.0204 (break-shift).
  // The plan's 0.05/0.06 thresholds assume artifact-free compositing (true
  // for the 1-doc print path), so the dialog thresholds are calibrated to
  // 0.08 — 2x the measured artifact with margin, still far below any real
  // content-mismatch signal (a wrong page or missing section reads ≫0.08).
  // The count-equality + thead structural assertions below are artifact-free.
  // edge-22: the watermark renders in dialog slice 0 only — each block holds
  // the same CLIPPED DocumentPage, so slice 0 (like PDF page 1, ADR 0002)
  // carries the watermark and later slices are below its continuous position.
  // edge-20: torture fixture page-block count == PDF numPages, stable at 2.
  const DIALOG_PAGE1_MAX_FRACTION = 0.08
  const DIALOG_PAGE_N_MAX_FRACTION = 0.08

  await page.goto(`/?fixture=${FIXTURE}`) // minimal (default template), A4 default
  await page.waitForSelector('#print-root')
  await page.evaluate(() => document.fonts.ready)

  await page.getByRole('button', { name: 'Print preview' }).click()
  const blocks = page.locator('.page-block')
  await expect(blocks).toHaveCount(2)

  // PDF capture must run under print media (calibration); the dialog content
  // is print:hidden there, so capture the PDF first, then return to screen
  // media for the block screenshots.
  await page.emulateMedia({ media: 'print' })
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await page.emulateMedia({ media: 'screen' })
  const { pages, numPages } = await rasterizePdf(pdf, A4_WIDTH_PX)

  await expect(blocks).toHaveCount(numPages) // remounted after the print pass
  expect(await blocks.count(), 'dialog page-block count == PDF numPages (edge-20)').toBe(numPages)

  // edge-23: the repeated thead must be the first rows of block 1 (DOM-level,
  // artifact-free — the compositor bug does not affect layout).
  const block1Text = await blocks.nth(1).textContent()
  expect(block1Text, 'dialog page 2 repeats the table header (edge-23)').toContain('Item')

  for (let i = 0; i < numPages; i++) {
    // The block is already 794px wide (pageW at deviceScaleFactor 1) —
    // normalize() is the identity guard against any DPR drift (Pitfall 3).
    const shot = normalize(PNG.sync.read(await blocks.nth(i).screenshot()), A4_WIDTH_PX)
    const pdfPage = pages[i]
    const label = `dialog page ${i + 1}`

    if (i === 0) {
      // Page 1 aligns exactly with the slice top (dy = 0, no shift search).
      const { fraction, diff } = diffFraction(shot, pdfPage, DIFF_THRESHOLD)
      if (fraction >= DIALOG_PAGE1_MAX_FRACTION) writeArtifacts(`dialog-vs-pdf-${label}`, shot, pdfPage, diff)
      expect(fraction, label).toBeLessThan(DIALOG_PAGE1_MAX_FRACTION)
    } else {
      // Pages >= 2: same thead-strip exclusion + bounded break-shift search as
      // the print-vs-PDF test (Pitfall 5 — a row-boundary push between the
      // continuous dialog slice and Chromium's pagination is absorbed by
      // MAX_BREAK_SHIFT_PX, never "fixed" by reimplementing fragmentation).
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

/** D-11: edit-mode #print-root DOM matches view-mode goldens (unfocused — no caret, no chrome). */
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

    // Compare against the committed golden — must be pixel-identical
    // (single-paragraph AST wrapper is visually lossless).
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

/** D-11: print projection has no editing artifacts (no contentEditable, no chrome). */
test('fixture: print projection has no editing artifacts (D-11)', async ({ page }) => {
  await page.goto(`/?fixture=${FIXTURE}`)
  await page.waitForSelector('#print-root')
  await page.evaluate(() => document.fonts.ready)
  await page.emulateMedia({ media: 'print' })

  // Structural assertion: no [contenteditable] elements in print media.
  const editableCount = await page.locator('#print-root [contenteditable]').count()
  expect(editableCount, 'print projection must have zero contentEditable elements').toBe(0)
})
