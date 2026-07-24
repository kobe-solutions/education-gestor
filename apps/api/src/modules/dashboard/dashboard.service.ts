import { getSchoolMetricsRepository, getAdminMetricsRepository, getAdminActivityRepository } from './dashboard.repository'

export async function getSchoolDashboardService(schoolId: string) {
  return getSchoolMetricsRepository(schoolId)
}

export async function getAdminDashboardService() {
  return getAdminMetricsRepository()
}

export async function getAdminActivityService(opts: {
  limit: number
  offset: number
  action?: string
  entity?: string
}) {
  return getAdminActivityRepository(opts)
}
