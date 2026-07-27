export function fmtBRL(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function parseLocalDate(d: string) {
  return new Date(d + 'T12:00:00')
}

export function formatDateBR(d: string) {
  return parseLocalDate(d).toLocaleDateString('pt-BR')
}

export function maskDoc(value: string | null | undefined): string {
  if (!value) return '—'
  return value.replace(/[a-zA-Z0-9]/g, '*')
}
