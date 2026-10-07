import { createCanvas } from '@napi-rs/canvas'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

// Scale normalization, rasterization and pixel diff helpers; pdfjs legacy build is used because the modern one needs DOMMatrix.

// A4 width at 96dpi: 210mm = 793.7px, rounded to 794 (also the normalize target).
export const A4_WIDTH_PX = 794
// A4 height at 96dpi: 297mm = 1122.5px, rounded to 1123.
export const A4_HEIGHT_PX = 1123

export interface RGB {
  r: number
  g: number
  b: number
}

export interface Rect {
  x?: number
  y: number
  w?: number
  h: number
}

export interface DiffResult {
  // Fraction of counted differing pixels (anti-aliasing excluded).
  fraction: number
  // pixelmatch diff image (red = diff, gray = AA) for artifact upload.
  diff: PNG
}

function sampleBilinear(img: PNG, sx: number, sy: number, out: Buffer, oi: number): void {
  const x0 = Math.floor(sx)
  const y0 = Math.floor(sy)
  const fx = sx - x0
  const fy = sy - y0
  const x1 = Math.min(x0 + 1, img.width - 1)
  const y1 = Math.min(y0 + 1, img.height - 1)
  const x0c = Math.max(x0, 0)
  const y0c = Math.max(y0, 0)
  const i00 = (y0c * img.width + x0c) * 4
  const i10 = (y0c * img.width + x1) * 4
  const i01 = (y1 * img.width + x0c) * 4
  const i11 = (y1 * img.width + x1) * 4
  for (let c = 0; c < 4; c++) {
    const top = img.data[i00 + c] * (1 - fx) + img.data[i10 + c] * fx
    const bot = img.data[i01 + c] * (1 - fx) + img.data[i11 + c] * fx
    out[oi + c] = Math.round(top * (1 - fy) + bot * fy)
  }
}

// Resizes an image to targetWidth with bilinear sampling, preserving aspect ratio.
export function normalize(img: PNG, targetWidth: number): PNG {
  if (img.width === targetWidth) return img
  const scale = targetWidth / img.width
  const targetHeight = Math.round(img.height * scale)
  const out = new PNG({ width: targetWidth, height: targetHeight })
  for (let y = 0; y < targetHeight; y++) {
    const sy = (y + 0.5) / scale - 0.5
    for (let x = 0; x < targetWidth; x++) {
      const sx = (x + 0.5) / scale - 0.5
      sampleBilinear(img, sx, sy, out.data, (y * targetWidth + x) * 4)
    }
  }
  return out
}

// Crops rows [y0, y0+h) into a new PNG, clamped to the image height.
export function cropY(img: PNG, y0: number, h: number): PNG {
  const hh = Math.min(h, img.height - y0)
  const out = new PNG({ width: img.width, height: hh })
  img.data.copy(out.data, 0, y0 * img.width * 4, (y0 + hh) * img.width * 4)
  return out
}

// Rasterizes each PDF page to targetWidth, or at an explicit opts.scale (96/72 makes PNG width equal paper width in CSS px).
export async function rasterizePdf(
  pdfBuffer: Buffer,
  targetWidth: number,
  opts: { scale?: number } = {},
): Promise<{ pages: PNG[]; numPages: number }> {
  const doc = await getDocument({ data: new Uint8Array(pdfBuffer), useSystemFonts: true }).promise
  const pages: PNG[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const base = page.getViewport({ scale: 1 })
    const scale = opts.scale ?? targetWidth / base.width
    const viewport = page.getViewport({ scale })
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    pages.push(PNG.sync.read(canvas.toBuffer('image/png')))
  }
  return { pages, numPages: doc.numPages }
}

// Fraction of differing pixels over the common height; anti-aliasing pixels are marked but not counted.
export function diffFraction(a: PNG, b: PNG, threshold: number): DiffResult {
  const h = Math.min(a.height, b.height)
  const ca = cropY(a, 0, h)
  const cb = cropY(b, 0, h)
  const diff = new PNG({ width: a.width, height: h })
  const n = pixelmatch(ca.data, cb.data, diff.data, a.width, h, {
    threshold,
    includeAA: false,
  })
  return { fraction: n / (a.width * h), diff }
}

// Blends a hex foreground at alpha over a solid background per channel, rounded.
export function blendColor(hex: string, alpha: number, bg: RGB): RGB {
  const c = parseInt(hex.slice(1), 16)
  const fg = { r: (c >> 16) & 255, g: (c >> 8) & 255, b: c & 255 }
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
  }
}

// Counts band pixels within tol of target; blueDominant also requires b - r > 8 to reject gray text anti-aliasing.
export function countPixelsInRange(
  img: PNG,
  band: Rect,
  target: RGB,
  tol: number,
  opts: { blueDominant?: boolean } = {},
): number {
  const x0 = band.x ?? 0
  const w = band.w ?? img.width - x0
  let n = 0
  for (let y = band.y; y < Math.min(band.y + band.h, img.height); y++) {
    for (let x = x0; x < Math.min(x0 + w, img.width); x++) {
      const i = (y * img.width + x) * 4
      const r = img.data[i]
      const g = img.data[i + 1]
      const b = img.data[i + 2]
      if (
        Math.abs(r - target.r) <= tol &&
        Math.abs(g - target.g) <= tol &&
        Math.abs(b - target.b) <= tol &&
        (!opts.blueDominant || b - r > 8)
      ) {
        n++
      }
    }
  }
  return n
}
