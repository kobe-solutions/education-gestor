import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'

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
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get<DashboardData>('/dashboard')
      return res.data
    },
  })
}

export function isAdminDashboard(data: DashboardData): data is AdminDashboard {
  return 'secretariasCount' in data
}
