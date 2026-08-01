export function maskBRL(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const raw = parseInt(digits, 10)
  const formatted = (raw / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
  return formatted
}

export function unmaskBRL(value: string) {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}
