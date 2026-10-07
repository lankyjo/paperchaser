// Bounding box of non-transparent pixels in RGBA data, grown by padding and clamped to the canvas; null when blank.
export function opaqueBounds(data: Uint8ClampedArray, width: number, height: number, padding: number) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }
  if (maxX < 0) return null
  const x = Math.max(0, minX - padding)
  const y = Math.max(0, minY - padding)
  return { x, y, width: Math.min(width - 1, maxX + padding) - x + 1, height: Math.min(height - 1, maxY + padding) - y + 1 }
}
