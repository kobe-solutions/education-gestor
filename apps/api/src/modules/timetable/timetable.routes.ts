import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { getSchoolId } from '../../lib/routeHelpers'
import { createTimetableSlotBodySchema, updateTimetableSlotBodySchema } from './timetable.schema'
import {
  createTimetableSlotService,
  listTimetableSlotsService,
  listAllTimetableSlotsService,
  getTimetableSlotService,
  updateTimetableSlotService,
  deleteTimetableSlotService,
} from './timetable.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor'])]

export async function timetableRoutes(app: FastifyInstance) {
  app.get('/timetable-slots', { preHandler }, async (request, reply) => {
    const { classId } = request.query as { classId?: string }
    if (!classId) return reply.send(await listAllTimetableSlotsService(getSchoolId(request)))
    return reply.send(await listTimetableSlotsService(getSchoolId(request), classId))
  })

  app.get('/timetable-slots/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getTimetableSlotService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Timetable slot not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/timetable-slots', { preHandler }, async (request, reply) => {
    try {
      const body = createTimetableSlotBodySchema.parse(request.body)
      const slot = await createTimetableSlotService(getSchoolId(request), body)
      return reply.status(201).send(slot)
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher already has a slot at this time') {
        return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/timetable-slots/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateTimetableSlotBodySchema.parse(request.body)
      return reply.send(await updateTimetableSlotService(getSchoolId(request), id, body))
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Timetable slot not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Teacher already has a slot at this time') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/timetable-slots/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteTimetableSlotService(getSchoolId(request), id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Timetable slot not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}
