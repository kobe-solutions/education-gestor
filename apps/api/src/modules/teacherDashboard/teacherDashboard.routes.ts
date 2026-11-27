import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { TenantPayload } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { errorHandler, successHandler } from '../../lib/responseHandlers'
import { getTeacherDashboardService } from './teacherDashboard.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['professor'])]

export async function teacherDashboardRoutes(app: FastifyInstance) {
  app.get('/teacher/dashboard', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const teacherId = (request.user as TenantPayload).userId
      const dashboard = await getTeacherDashboardService(schoolId, teacherId)
      return successHandler(reply, 'Painel do professor carregado com sucesso.', 200, dashboard)
    } catch {
      return errorHandler(reply, 'Não foi possível carregar o painel do professor. Tente novamente.', 500)
    }
  })
}
