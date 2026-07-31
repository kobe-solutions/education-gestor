import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles, type TenantPayload } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { logAudit } from '../../lib/audit'
import { createEventBodySchema, updateEventBodySchema, listEventsQuerySchema } from './events.schema'
import {
  listEventsService,
  getEventService,
  createEventService,
  updateEventService,
  deleteEventService,
} from './events.service'

const readHandler = [authenticate, injectTenant]
const writeHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function eventsRoutes(app: FastifyInstance) {
  app.get('/events', { preHandler: readHandler }, async (request, reply) => {
    const query = listEventsQuerySchema.parse(request.query)
    return reply.send(await listEventsService(getSchoolId(request), query))
  })

  app.get('/events/:id', { preHandler: readHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getEventService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Event not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/events', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const body = createEventBodySchema.parse(request.body)
      const event = await createEventService(getSchoolId(request), body)
      const user = request.user as TenantPayload
      await logAudit(
        { userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) },
        'CREATE',
        'event',
        event.id,
      )
      return reply.status(201).send(event)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Event not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Event already exists at this time') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/events/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateEventBodySchema.parse(request.body)
      const event = await updateEventService(getSchoolId(request), id, body)
      const user = request.user as TenantPayload
      await logAudit(
        { userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) },
        'UPDATE',
        'event',
        id,
      )
      return reply.send(event)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Event not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Event already exists at this time') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/events/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteEventService(getSchoolId(request), id)
      const user = request.user as TenantPayload
      await logAudit(
        { userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) },
        'DELETE',
        'event',
        id,
      )
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Event not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}
