import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'

export interface TuitionStat {
  count: number
  total: string
}

export interface UpcomingTuition {
  id: string
  studentId: string
  studentName: string
  amount: string
  dueDate: string
  status: 'pending' | 'overdue'
}

export interface SchoolDashboard {
  studentsCount: number
  teachersCount: number
  classesCount: number
  tuitions: {
    pending: TuitionStat
    paid: TuitionStat
    overdue: TuitionStat
  }
  upcomingTuitions: UpcomingTuition[]
}

export interface AdminDashboard {
  secretariasCount: number
  schoolsCount: number
}

export type DashboardData = SchoolDashboard | AdminDashboard

export function useDashboard() {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['dashboard', schoolKey],
    queryFn: async () => {
      const res = await api.get<DashboardData>('/dashboard')
      return res.data
    },
    enabled,
  })
}

export function isAdminDashboard(data: DashboardData): data is AdminDashboard {
  return 'secretariasCount' in data
}
