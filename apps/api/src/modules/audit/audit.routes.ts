import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../../db'
import { auditLogs } from '../../db/schema/auditLog'
import type { TenantPayload } from '../../middlewares/authorize'

const preHandler = [authenticate, injectTenant, authorizeRoles(['gestor', 'admin'])]

export async function auditRoutes(app: FastifyInstance) {
  app.get('/audit-logs', { preHandler }, async (request, reply) => {
    const user = request.user as TenantPayload
    const { entity, limit = '50', page = '1' } = request.query as {
      entity?: string
      limit?: string
      page?: string
    }

    const limitN = Math.min(parseInt(limit, 10) || 50, 200)
    const offset = (parseInt(page, 10) - 1 || 0) * limitN

    const conditions = [eq(auditLogs.schoolId, user.schoolId)]
    if (entity) conditions.push(eq(auditLogs.entity, entity))

    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limitN)
      .offset(offset)

    return reply.send(logs)
  })
}
