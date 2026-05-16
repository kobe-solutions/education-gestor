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
  schoolsCount: 12,
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
