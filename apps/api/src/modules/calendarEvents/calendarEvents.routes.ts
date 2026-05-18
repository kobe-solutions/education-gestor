import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { createCalendarEventBodySchema, updateCalendarEventBodySchema } from './calendarEvents.schema'
import {
  listCalendarEventsService,
  getCalendarEventService,
  createCalendarEventService,
  updateCalendarEventService,
  deleteCalendarEventService,
} from './calendarEvents.service'

const writeHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]
const readHandler = [authenticate, injectTenant]

export async function calendarEventsRoutes(app: FastifyInstance) {
  app.get(
    '/academic-years/:yearId/events',
    { preHandler: readHandler },
    async (request, reply) => {
      const { yearId } = request.params as { yearId: string }
      return reply.send(await listCalendarEventsService(getSchoolId(request), yearId))
    },
  )

  app.get(
    '/academic-years/:yearId/events/:id',
    { preHandler: readHandler },
    async (request, reply) => {
      try {
        const { yearId, id } = request.params as { yearId: string; id: string }
        return reply.send(await getCalendarEventService(getSchoolId(request), yearId, id))
      } catch (error) {
        if (error instanceof Error && error.message === 'Calendar event not found') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    },
  )

  app.post(
    '/academic-years/:yearId/events',
    { preHandler: writeHandler },
    async (request, reply) => {
      const { yearId } = request.params as { yearId: string }
      const body = createCalendarEventBodySchema.parse(request.body)
      const event = await createCalendarEventService(getSchoolId(request), yearId, body)
      return reply.status(201).send(event)
    },
  )

  app.put(
    '/academic-years/:yearId/events/:id',
    { preHandler: writeHandler },
    async (request, reply) => {
      try {
        const { yearId, id } = request.params as { yearId: string; id: string }
        const body = updateCalendarEventBodySchema.parse(request.body)
        return reply.send(await updateCalendarEventService(getSchoolId(request), yearId, id, body))
      } catch (error) {
        if (error instanceof Error && error.message === 'Calendar event not found') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    },
  )

  app.delete(
    '/academic-years/:yearId/events/:id',
    { preHandler: writeHandler },
    async (request, reply) => {
      try {
        const { yearId, id } = request.params as { yearId: string; id: string }
        await deleteCalendarEventService(getSchoolId(request), yearId, id)
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof Error && error.message === 'Calendar event not found') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    },
  )
}
