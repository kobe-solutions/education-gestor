import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

interface ShortcutAction {
  keys: string
  label: string
  to?: string
}

export const SHORTCUTS: ShortcutAction[] = [
  { keys: '/', label: 'Focar na busca' },
  { keys: 'g → p', label: 'Ir para Pessoas', to: '/people' },
  { keys: 'g → a', label: 'Ir para Acadêmico', to: '/academic' },
  { keys: 'g → f', label: 'Ir para Financeiro', to: '/financial' },
  { keys: 'g → e', label: 'Ir para Eventos escolares', to: '/school-events' },
  { keys: 'g → s', label: 'Ir para Configurações', to: '/settings' },
  { keys: '?', label: 'Mostrar atalhos' },
]

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

/**
 * Registra atalhos de teclado globais:
 * - `?` abre a cheat sheet de atalhos
 * - `/` foca no primeiro input de busca da página
 * - `g` + letra navega para destinos comuns (gestor/professor)
 * Não dispara quando o usuário está digitando em inputs.
 */
export function useKeyboardShortcuts(onOpenHelp: () => void) {
  const navigate = useNavigate()
  const gPressed = useRef<number | null>(null)

  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]')
    searchInput?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return

      if (e.key === '?') {
        e.preventDefault()
        onOpenHelp()
        return
      }

      if (e.key === '/') {
        e.preventDefault()
        focusSearch()
        return
      }

      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        gPressed.current = Date.now()
        return
      }

      // sequência g → letra dentro de 1s
      if (gPressed.current !== null && Date.now() - gPressed.current <= 1000) {
        const map: Record<string, string> = {
          p: '/people',
          a: '/academic',
          f: '/financial',
          e: '/school-events',
          s: '/settings',
        }
        const to = map[e.key]
        gPressed.current = null
        if (to) {
          e.preventDefault()
          navigate(to)
        }
      } else if (gPressed.current !== null) {
        gPressed.current = null
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate, onOpenHelp, focusSearch])
}
