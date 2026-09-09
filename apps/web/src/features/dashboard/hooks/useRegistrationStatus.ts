import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'

export interface RegistrationSubject {
  subjectId: string
  subjectName: string
  weekDay: string
  periodName: string
  periodStartTime: string
  periodEndTime: string
  attendanceRegistered: boolean
  gradesRegistered: boolean
}

export interface RegistrationClass {
  classId: string
  className: string
  subjects: RegistrationSubject[]
}

export interface RegistrationTeacher {
  teacherId: string
  teacherName: string
  classes: RegistrationClass[]
}

export interface RegistrationSummary {
  totalSlots: number
  attendanceRegistered: number
  gradesRegistered: number
}

export interface RegistrationStatusData {
  data: RegistrationTeacher[]
  total: number
  summary: RegistrationSummary
}

export interface RegistrationStatusFilters {
  teacherId?: string
  classId?: string
  page?: number
  limit?: number
}

export function useRegistrationStatus(filters?: RegistrationStatusFilters) {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['registration-status', schoolKey, filters?.teacherId, filters?.classId, filters?.page, filters?.limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.teacherId) params.set('teacherId', filters.teacherId)
      if (filters?.classId) params.set('classId', filters.classId)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))
      const qs = params.toString()
      const res = await api.get<RegistrationStatusData>(`/dashboard/registration-status${qs ? `?${qs}` : ''}`)
      return res.data
    },
    enabled,
  })
}
