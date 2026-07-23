import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSchoolDashboardService, getAdminDashboardService } from '../../modules/dashboard/dashboard.service'
import * as repo from '../../modules/dashboard/dashboard.repository'

vi.mock('../../modules/dashboard/dashboard.repository')

const mockSchoolMetrics = {
  studentsCount: 120,
  teachersCount: 15,
  classesCount: 8,
  tuitions: {
    pending: { count: 30, total: '22500' },
    paid: { count: 80, total: '60000' },
    overdue: { count: 10, total: '7500' },
  },
  upcomingTuitions: [],
}

const mockAdminMetrics = {
  secretariasCount: 3,
  secretariasActive: 2,
  schoolsCount: 12,
  studentsCount: 500,
  studentsByStatus: { active: 450, inactive: 30, transferred: 10, cancelled: 10 },
  teachersCount: 40,
  teachersByStatus: { ativo: 35, inativo: 3, licenca: 2 },
  classesCount: 25,
  tuitions: {
    pending: { count: 80, total: '40000' },
    paid: { count: 400, total: '200000' },
    overdue: { count: 20, total: '10000' },
  },
  topSchools: [],
  recentActivity: [],
}

beforeEach(() => vi.clearAllMocks())

describe('getSchoolDashboardService', () => {
  it('delega para o repository com o schoolId correto', async () => {
    vi.mocked(repo.getSchoolMetricsRepository).mockResolvedValue(mockSchoolMetrics)

    const result = await getSchoolDashboardService('school-id')

    expect(result).toEqual(mockSchoolMetrics)
    expect(repo.getSchoolMetricsRepository).toHaveBeenCalledWith('school-id')
    expect(repo.getSchoolMetricsRepository).toHaveBeenCalledTimes(1)
  })

  it('propaga erros do repository', async () => {
    vi.mocked(repo.getSchoolMetricsRepository).mockRejectedValue(new Error('DB error'))

    await expect(getSchoolDashboardService('school-id')).rejects.toThrow('DB error')
  })
})

describe('getAdminDashboardService', () => {
  it('retorna métricas globais do admin', async () => {
    vi.mocked(repo.getAdminMetricsRepository).mockResolvedValue(mockAdminMetrics)

    const result = await getAdminDashboardService()

    expect(result).toEqual(mockAdminMetrics)
    expect(repo.getAdminMetricsRepository).toHaveBeenCalledTimes(1)
  })

  it('propaga erros do repository', async () => {
    vi.mocked(repo.getAdminMetricsRepository).mockRejectedValue(new Error('DB error'))

    await expect(getAdminDashboardService()).rejects.toThrow('DB error')
  })
})
