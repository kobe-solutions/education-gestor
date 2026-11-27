import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import type { UserRole } from '@education-gestor/types'
import { useAuth } from '../contexts/AuthContext'

export interface ShortcutAction {
  keys: string
  label: string
  to?: string
  roles?: UserRole[]
}

export const SHORTCUTS: ShortcutAction[] = [
  { keys: '/', label: 'Focar na busca' },
  { keys: 'g → p', label: 'Ir para Pessoas', to: '/people', roles: ['gestor', 'secretaria'] },
  { keys: 'g → a', label: 'Ir para Acadêmico', to: '/academic', roles: ['gestor', 'secretaria', 'professor'] },
  { keys: 'g → f', label: 'Ir para Financeiro', to: '/financial', roles: ['gestor', 'secretaria'] },
  { keys: 'g → e', label: 'Ir para Eventos escolares', to: '/school-events', roles: ['gestor', 'secretaria', 'professor'] },
  { keys: '?', label: 'Mostrar atalhos' },
]

export function getShortcutsForRole(role?: UserRole): ShortcutAction[] {
  return SHORTCUTS.filter((shortcut) => !shortcut.roles || (role && shortcut.roles.includes(role)))
}

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
  const { payload } = useAuth()
  const gPressed = useRef<number | null>(null)
  const role = payload?.role as UserRole | undefined

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
        const shortcut = getShortcutsForRole(role).find((item) => item.keys === `g → ${e.key}`)
        gPressed.current = null
        if (shortcut?.to) {
          e.preventDefault()
          navigate(shortcut.to)
        }
      } else if (gPressed.current !== null) {
        gPressed.current = null
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate, onOpenHelp, focusSearch, role])
}
