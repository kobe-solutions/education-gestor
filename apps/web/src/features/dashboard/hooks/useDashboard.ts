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

export interface TopSchool {
  id: string
  name: string
  studentCount: number
}

export interface ActivityEntry {
  id: string
  userId: string
  userRole: string
  action: string
  entity: string
  entityId: string
  createdAt: string
}

export interface AdminDashboard {
  secretariasCount: number
  secretariasActive: number
  schoolsCount: number
  studentsCount: number
  studentsByStatus: { active: number; inactive: number; transferred: number; cancelled: number }
  teachersCount: number
  teachersByStatus: { ativo: number; inativo: number; licenca: number }
  classesCount: number
  tuitions: {
    pending: TuitionStat
    paid: TuitionStat
    overdue: TuitionStat
  }
  topSchools: TopSchool[]
  recentActivity: ActivityEntry[]
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
  return 'secretariasActive' in data
}
