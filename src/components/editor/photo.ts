export const PHOTO_MAX_SIDE = 400
export const PHOTO_ACCEPT = 'image/jpeg,image/png'
const MAX_FILE_BYTES = 15 * 1024 * 1024

/** Target size that fits within maxSide on the long edge, never upscaling. */
export function fitWithin(width: number, height: number, maxSide = PHOTO_MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Nie udało się odczytać obrazu.'))
    }
    img.src = url
  })
}

/** Downscales a JPG/PNG to max 400px on the long side and returns a JPEG data URL. */
export async function processPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('Wybierz plik JPG lub PNG.')
  if (file.size > MAX_FILE_BYTES) throw new Error('Plik jest za duży (maks. 15 MB).')
  const img = await loadImage(file)
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Twoja przeglądarka nie obsługuje przetwarzania obrazów.')
  // JPEG has no alpha: paint white under transparent PNGs.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.86)
}
