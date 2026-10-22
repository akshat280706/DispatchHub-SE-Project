import { AppError } from './errors'

export const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_PROOF_BYTES = 5 * 1024 * 1024
const MAX_SIDE = 1600

// Validates the file and shrinks big phone photos to a JPEG before upload.
export async function prepareProofImage(file: File): Promise<Blob> {
  if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
    throw new AppError('Choose a JPEG, PNG or WebP photo.')
  }

  let result: Blob = file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
      if (blob) result = blob
    }
  } catch {
    // If resizing is not possible, the original file is used when it is small enough.
  }

  if (result.size > MAX_PROOF_BYTES) {
    throw new AppError('This photo is too large (5 MB maximum). Try a smaller one.')
  }
  return result
}