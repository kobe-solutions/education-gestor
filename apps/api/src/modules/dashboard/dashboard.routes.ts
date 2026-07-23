import type { FastifyInstance, FastifyRequest } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { JwtPayload, SecretariaPayload, TenantPayload } from '../../middlewares/authorize'
import { getSchoolDashboardService, getAdminDashboardService, getAdminActivityService } from './dashboard.service'

const anyAuth = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor', 'professor', 'secretaria'])]

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', { preHandler: anyAuth }, async (request: FastifyRequest, reply) => {
    const user = request.user as JwtPayload

    if (user.role === 'admin') {
      return reply.send(await getAdminDashboardService())
    }

    const schoolId =
      user.role === 'secretaria'
        ? (user as SecretariaPayload & { schoolId?: string }).schoolId
        : (user as TenantPayload).schoolId

    if (!schoolId) {
      return reply.send({
        studentsCount: 0,
        teachersCount: 0,
        classesCount: 0,
        tuitions: {
          pending: { count: 0, total: '0' },
          paid: { count: 0, total: '0' },
          overdue: { count: 0, total: '0' },
        },
        upcomingTuitions: [],
      })
    }

    return reply.send(await getSchoolDashboardService(schoolId))
  })

  const adminOnly = [authenticate, injectTenant, authorizeRoles(['admin'])]

  app.get('/admin/activity', { preHandler: adminOnly }, async (request: FastifyRequest, reply) => {
    const query = request.query as Record<string, string | undefined>
    const limit = Math.min(Number(query.limit) || 20, 100)
    const offset = Number(query.offset) || 0
    const action = query.action || undefined
    const entity = query.entity || undefined

    return reply.send(await getAdminActivityService({ limit, offset, action, entity }))
  })
}
