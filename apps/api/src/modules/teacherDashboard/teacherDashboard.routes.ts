import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { TenantPayload } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { getTeacherDashboardService } from './teacherDashboard.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['professor'])]

export async function teacherDashboardRoutes(app: FastifyInstance) {
  app.get('/teacher/dashboard', { preHandler }, async (request, reply) => {
    const schoolId = getSchoolId(request)
    const teacherId = (request.user as TenantPayload).userId
    return reply.send(await getTeacherDashboardService(schoolId, teacherId))
  })
}
