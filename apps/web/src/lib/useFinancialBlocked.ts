import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useFinancialVisibility } from '../contexts/FinancialVisibilityContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import { api } from './api'
import type { School } from '@education-gestor/types'

export function useFinancialBlocked() {
  const { payload } = useAuth()
  const { hideFinancialData } = useFinancialVisibility()
  const { activeSchoolId } = useSchoolContext()

  const schoolId = payload?.role === 'gestor' || payload?.role === 'professor'
    ? (payload as Record<string, unknown>).schoolId as string
    : activeSchoolId

  const { data: school, isLoading } = useQuery({
    queryKey: ['school-financial-setting', schoolId],
    queryFn: async () => {
      const res = await api.get<School>(`/schools/${schoolId}`)
      return res.data
    },
    enabled: !!schoolId && ['gestor', 'professor', 'secretaria'].includes(payload?.role ?? ''),
  })

  const adminBlocked = hideFinancialData
  const entityBlocked = schoolId ? !school?.showFinancial : false

  return {
    blocked: adminBlocked || entityBlocked,
    loading: !!schoolId && isLoading && !school,
  }
}
