export type MaskType = 'cpf' | 'cnpj' | 'cep' | 'phone' | 'rg'

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function maskCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function maskCNPJ(value: string): string {
  const digits = onlyDigits(value).slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function maskCEP(value: string): string {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function maskRG(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^0-9X]/g, '')
  let normalized = ''
  for (const ch of cleaned) {
    if (normalized.length < 8) {
      if (ch >= '0' && ch <= '9') normalized += ch
    } else if (normalized.length === 8) {
      normalized += ch
      break
    }
  }

  if (normalized.length <= 2) return normalized
  if (normalized.length <= 5) return `${normalized.slice(0, 2)}.${normalized.slice(2)}`
  if (normalized.length <= 8) {
    return `${normalized.slice(0, 2)}.${normalized.slice(2, 5)}.${normalized.slice(5)}`
  }
  return `${normalized.slice(0, 2)}.${normalized.slice(2, 5)}.${normalized.slice(5, 8)}-${normalized.slice(8)}`
}

const MASK_HANDLERS: Record<MaskType, (value: string) => string> = {
  cpf: maskCPF,
  cnpj: maskCNPJ,
  cep: maskCEP,
  phone: maskPhone,
  rg: maskRG,
}

export function applyMask(mask: MaskType, value: string): string {
  return MASK_HANDLERS[mask](value)
}
