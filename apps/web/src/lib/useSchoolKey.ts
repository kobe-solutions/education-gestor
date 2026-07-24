import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import type { TenantPayload } from '@education-gestor/types'

/**
 * Retorna a chave de escola para query keys e um flag `enabled`.
 * - admin: sempre habilitado, sem schoolKey
 * - gestor/professor: schoolId vem do JWT, sempre habilitado
 * - secretaria: schoolId vem do contexto, desabilitado se não selecionado
 */
export function useSchoolKey() {
  const { payload } = useAuth()
  const { activeSchoolId } = useSchoolContext()

  if (!payload) return { schoolKey: null, enabled: false }

  if (payload.role === 'admin') {
    return { schoolKey: 'admin', enabled: true }
  }

  if (payload.role === 'secretaria') {
    return { schoolKey: activeSchoolId ?? null, enabled: !!activeSchoolId }
  }

  const schoolId = (payload as TenantPayload).schoolId ?? null
  return { schoolKey: schoolId, enabled: !!schoolId }
}
