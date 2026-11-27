import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles, type TenantPayload } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { handleRouteError, successHandler } from '../../lib/responseHandlers'
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
    try {
      const query = listEventsQuerySchema.parse(request.query)
      const events = await listEventsService(getSchoolId(request), query)
      return successHandler(reply, 'Eventos carregados com sucesso.', 200, events)
    } catch (error) {
      return handleRouteError(reply, error, 'Os filtros dos eventos são inválidos.')
    }
  })

  app.get('/events/:id', { preHandler: readHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const event = await getEventService(getSchoolId(request), id)
      return successHandler(reply, 'Evento carregado com sucesso.', 200, event)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar o evento.', [
        { message: 'Event not found', status: 404 },
      ])
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
      return successHandler(reply, 'Evento criado com sucesso.', 201, event)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do evento são inválidos.', [
        { message: 'Event not found', status: 404 },
        { message: 'Event already exists at this time', status: 409, responseMessage: 'Já existe um evento neste horário.' },
      ])
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
      return successHandler(reply, 'Evento atualizado com sucesso.', 200, event)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do evento são inválidos.', [
        { message: 'Event not found', status: 404 },
        { message: 'Event already exists at this time', status: 409, responseMessage: 'Já existe um evento neste horário.' },
      ])
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
      return successHandler(reply, 'Evento excluído com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível excluir o evento.', [
        { message: 'Event not found', status: 404 },
      ])
    }
  })
}
