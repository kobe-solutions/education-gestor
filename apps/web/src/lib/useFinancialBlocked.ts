import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import { api, type ApiSuccessResponse } from './api'
import type { School } from '@education-gestor/types'

export function useFinancialBlocked() {
  const { payload } = useAuth()
  const { activeSchoolId } = useSchoolContext()

  const schoolId = payload?.role === 'gestor' || payload?.role === 'professor'
    ? (payload as Record<string, unknown>).schoolId as string
    : activeSchoolId

  const { data: school, isLoading } = useQuery({
    queryKey: ['school-financial-setting', schoolId],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<School>>(`/schools/${schoolId}`)
      return res.data.data
    },
    enabled: !!schoolId && payload?.role === 'secretaria',
  })

  const entityBlocked = schoolId ? !school?.showFinancial : false
  const blocked = payload?.role === 'secretaria' && entityBlocked

  return {
    blocked,
    loading: payload?.role === 'secretaria' && !!schoolId && isLoading && !school,
  }
}
