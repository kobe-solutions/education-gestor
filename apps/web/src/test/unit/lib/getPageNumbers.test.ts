import { describe, it, expect } from 'vitest'
import { getPageNumbers } from '../../../lib/getPageNumbers'

describe('getPageNumbers', () => {
  it('retorna apenas [1] quando total=1', () => {
    expect(getPageNumbers(1, 1)).toEqual([1])
  })

  it('retorna lista completa quando total<=5', () => {
    expect(getPageNumbers(2, 4)).toEqual([1, 2, 3, 4])
    expect(getPageNumbers(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('mostra vizinhos do início sem ellipsis esquerdo quando current<=2', () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, '...', 10])
    expect(getPageNumbers(2, 10)).toEqual([1, 2, 3, '...', 10])
  })

  it('mostra vizinhos do fim sem ellipsis direito quando current>=total-1', () => {
    expect(getPageNumbers(9, 10)).toEqual([1, '...', 8, 9, 10])
    expect(getPageNumbers(10, 10)).toEqual([1, '...', 9, 10])
  })

  it('mostra ellipsis de ambos os lados no meio', () => {
    expect(getPageNumbers(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10])
  })

  it('funciona para totais grandes', () => {
    expect(getPageNumbers(50, 100)).toEqual([1, '...', 49, 50, 51, '...', 100])
    expect(getPageNumbers(1, 100)).toEqual([1, 2, '...', 100])
  })

  it('inclui first e last sempre', () => {
    const result = getPageNumbers(5, 10)
    expect(result[0]).toBe(1)
    expect(result[result.length - 1]).toBe(10)
  })
})