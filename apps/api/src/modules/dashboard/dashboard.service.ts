import { getSchoolMetricsRepository, getAdminMetricsRepository, getAdminActivityRepository, getRegistrationStatusRepository } from './dashboard.repository'

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

export async function getRegistrationStatusService(
  schoolId: string,
  filters?: { teacherId?: string; classId?: string },
  pagination?: { limit: number; offset: number },
) {
  return getRegistrationStatusRepository(schoolId, filters, pagination)
}
