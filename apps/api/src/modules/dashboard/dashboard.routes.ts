import type { FastifyInstance, FastifyRequest } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { JwtPayload, SecretariaPayload, TenantPayload } from '../../middlewares/authorize'
import { errorHandler, successHandler } from '../../lib/responseHandlers'
import { getSchoolDashboardService, getAdminDashboardService, getAdminActivityService, getRegistrationStatusService } from './dashboard.service'

const anyAuth = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor', 'professor', 'secretaria'])]

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', { preHandler: anyAuth }, async (request: FastifyRequest, reply) => {
    try {
      const user = request.user as JwtPayload

      if (user.role === 'admin') {
        return successHandler(reply, 'Painel carregado com sucesso.', 200, await getAdminDashboardService())
      }

      const schoolId =
        user.role === 'secretaria'
          ? (user as SecretariaPayload & { schoolId?: string }).schoolId
          : (user as TenantPayload).schoolId

      if (!schoolId) {
        return successHandler(reply, 'Painel carregado com sucesso.', 200, {
        studentsCount: 0,
        teachersCount: 0,
        classesCount: 0,
        tuitions: {
          total: { count: 0, total: '0' },
          pending: { count: 0, total: '0' },
          paid: { count: 0, total: '0' },
          overdue: { count: 0, total: '0' },
        },
        upcomingTuitions: [],
      })
      }

      return successHandler(reply, 'Painel carregado com sucesso.', 200, await getSchoolDashboardService(schoolId))
    } catch {
      return errorHandler(reply, 'Não foi possível carregar o painel. Tente novamente.', 500)
    }
  })

  const adminOnly = [authenticate, injectTenant, authorizeRoles(['admin'])]

  app.get('/admin/activity', { preHandler: adminOnly }, async (request: FastifyRequest, reply) => {
    const query = request.query as Record<string, string | undefined>
    const limit = Math.min(Number(query.limit) || 20, 100)
    const offset = Number(query.offset) || 0
    const action = query.action || undefined
    const entity = query.entity || undefined

    try {
      const activity = await getAdminActivityService({ limit, offset, action, entity })
      return successHandler(reply, 'Atividades carregadas com sucesso.', 200, activity)
    } catch {
      return errorHandler(reply, 'Não foi possível carregar as atividades. Tente novamente.', 500)
    }
  })

  // ── Registration Status (BUG-012) ────────────────────────────────────
  const managerAuth = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor', 'secretaria'])]

  app.get('/dashboard/registration-status', { preHandler: managerAuth }, async (request: FastifyRequest, reply) => {
    try {
      const user = request.user as JwtPayload

    const schoolId =
      user.role === 'secretaria'
        ? (user as SecretariaPayload & { schoolId?: string }).schoolId
        : (user as TenantPayload).schoolId

      if (!schoolId) {
        return successHandler(reply, 'Status de registros carregado com sucesso.', 200, { data: [], total: 0, summary: { totalSlots: 0, attendanceRegistered: 0 } })
      }

    const query = request.query as Record<string, string | undefined>
    const filters: { teacherId?: string; classId?: string } = {}
    if (query.teacherId) filters.teacherId = query.teacherId
    if (query.classId) filters.classId = query.classId

    const limit = Math.min(parseInt(query.limit ?? '50', 10) || 50, 200)
    const page = parseInt(query.page ?? '1', 10) || 1
    const offset = (page - 1) * limit

      const status = await getRegistrationStatusService(schoolId, filters, { limit, offset })
      return successHandler(reply, 'Status de registros carregado com sucesso.', 200, status)
    } catch {
      return errorHandler(reply, 'Não foi possível carregar o status de registros. Tente novamente.', 500)
    }
  })
}
