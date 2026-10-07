const MAX_SIDE = 1600

// Redraws an upload at most 1600px on a canvas as WebP; rasterizing also means scripts inside an SVG never run.
export async function compressImage(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight, 1))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
    return { dataUrl: canvas.toDataURL('image/webp', 0.8), width, height }
  } finally {
    URL.revokeObjectURL(url)
  }
}
