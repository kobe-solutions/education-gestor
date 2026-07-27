export function validateGradeValue(value: number): void {
  if (value < 0 || value > 10) throw new Error('Grade value must be between 0 and 10')
}

export function validatePositiveAmount(amount: number): void {
  if (amount <= 0) throw new Error('Amount must be greater than zero')
}

export function validateISODate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`)
}

const MIME_EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export function extFromMime(mime: string): string {
  return MIME_EXT_MAP[mime] ?? 'bin'
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export type FileValidationResult = { valid: true } | { valid: false; message: string }

export function validateImageFile(mimetype: string, size: number): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(mimetype as typeof ALLOWED_IMAGE_TYPES[number])) {
    return { valid: false, message: 'Formato inválido. Use JPEG, PNG ou WebP.' }
  }
  if (size > MAX_FILE_SIZE) {
    return { valid: false, message: 'Arquivo muito grande. Máximo 10MB.' }
  }
  return { valid: true }
}

export function validateDocumentFile(mimetype: string, size: number): FileValidationResult {
  if (!ALLOWED_DOC_TYPES.includes(mimetype as typeof ALLOWED_DOC_TYPES[number])) {
    return { valid: false, message: 'Formato inválido. Use PDF, JPEG ou PNG.' }
  }
  if (size > MAX_FILE_SIZE) {
    return { valid: false, message: 'Arquivo muito grande. Máximo 10MB.' }
  }
  return { valid: true }
}
