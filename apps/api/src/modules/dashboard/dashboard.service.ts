import { getSchoolMetricsRepository, getAdminMetricsRepository } from './dashboard.repository'

export async function getSchoolDashboardService(schoolId: string) {
  return getSchoolMetricsRepository(schoolId)
}

export async function getAdminDashboardService() {
  return getAdminMetricsRepository()
}
