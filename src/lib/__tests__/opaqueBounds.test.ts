import { describe, expect, it } from 'vitest'

import { opaqueBounds } from '../opaqueBounds'

// Builds RGBA pixels for a w x h canvas where listed [x, y] points are opaque ink.
function pixels(w: number, h: number, ink: [number, number][]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4)
  for (const [x, y] of ink) data[(y * w + x) * 4 + 3] = 255
  return data
}

describe('opaqueBounds', () => {
  it('returns the tight box around drawn ink plus padding, clamped to the canvas', () => {
    expect(opaqueBounds(pixels(10, 8, [[3, 2], [6, 5]]), 10, 8, 1)).toEqual({ x: 2, y: 1, width: 6, height: 6 })
    expect(opaqueBounds(pixels(10, 8, [[0, 0]]), 10, 8, 2)).toEqual({ x: 0, y: 0, width: 3, height: 3 })
  })

  it('returns null for an empty canvas', () => {
    expect(opaqueBounds(pixels(4, 4, []), 4, 4, 1)).toBeNull()
  })
})
