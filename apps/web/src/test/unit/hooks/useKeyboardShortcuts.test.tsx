import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { createProviders } from '../../render'
import { useKeyboardShortcuts, SHORTCUTS } from '../../../hooks/useKeyboardShortcuts'

function setup() {
  const onOpenHelp = vi.fn()
  const { Providers } = createProviders({ initialRoute: '/' })
  renderHook(() => useKeyboardShortcuts(onOpenHelp), { wrapper: Providers })
  return { onOpenHelp }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useKeyboardShortcuts', () => {
  it('abre a cheat sheet ao pressionar ?', () => {
    const { onOpenHelp } = setup()
    fireEvent.keyDown(document, { key: '?' })
    expect(onOpenHelp).toHaveBeenCalledTimes(1)
  })

  it('não dispara quando o usuário está digitando em um input', () => {
    const { onOpenHelp } = setup()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(input, { key: '?' })
    expect(onOpenHelp).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('expõe atalhos para a cheat sheet', () => {
    expect(SHORTCUTS.length).toBeGreaterThanOrEqual(6)
    expect(SHORTCUTS.some((s) => s.keys === '?')).toBe(true)
  })
})
