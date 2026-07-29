/**
 * Calcula quais números de página renderizar em controles de paginação com ellipsis.
 *
 * Exemplos:
 * - total=1                 → [1]
 * - total=4,  current=2     → [1, 2, 3, 4]
 * - total=10, current=5     → [1, '...', 4, 5, 6, '...', 10]
 * - total=10, current=1     → [1, 2, '...', 10]
 * - total=10, current=10    → [1, '...', 9, 10]
 * - total=10, current=2     → [1, 2, 3, '...', 10]
 * - total=10, current=9     → [1, '...', 8, 9, 10]
 */
export function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 1) return [1]
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // Janela de vizinhança a redor da página atual (±1)
  const windowStart = current - 1
  const windowEnd = current + 1

  const result: (number | '...')[] = [1]

  // Vizinhos antes da janela
  if (windowStart > 2) {
    result.push('...')
  } else if (windowStart === 2) {
    result.push(2)
  }

  // Janela (excluindo bordas já adicionadas: 1 e última)
  for (let p = Math.max(2, windowStart); p <= Math.min(total - 1, windowEnd); p++) {
    if (result[result.length - 1] !== p) result.push(p)
  }

  // Vizinhos depois da janela
  const last = result[result.length - 1] as number
  if (last < total - 1) {
    result.push('...')
  } else if (last === total - 1 && total - 1 !== total) {
    // já estávamos em total-1, falta conectar com total
    // (mas a checagem `last < total - 1` acima já cobre isso quando há gap real)
  }

  result.push(total)

  return result
}
