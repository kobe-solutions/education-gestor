import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import type { JwtPayload, TenantPayload } from '../../middlewares/authorize'
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
import { listTimetableSlotsByTeacherRepository } from './timetable.repository'

const readPreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor', 'professor'])]
const writePreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor', 'professor'])]

export async function timetableRoutes(app: FastifyInstance) {
  app.get('/timetable-slots', { preHandler: readPreHandler }, async (request, reply) => {
    const { classId } = request.query as { classId?: string }
    const user = request.user as JwtPayload
    const schoolId = getSchoolId(request)

    if (user.role === 'professor') {
      const teacherId = (user as TenantPayload).userId
      return reply.send(await listTimetableSlotsByTeacherRepository(schoolId, teacherId))
    }

    if (!classId) return reply.send(await listAllTimetableSlotsService(schoolId))
    return reply.send(await listTimetableSlotsService(schoolId, classId))
  })

  app.get('/timetable-slots/:id', { preHandler: readPreHandler }, async (request, reply) => {
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

  app.post('/timetable-slots', { preHandler: writePreHandler }, async (request, reply) => {
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

  app.put('/timetable-slots/:id', { preHandler: writePreHandler }, async (request, reply) => {
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

  app.delete('/timetable-slots/:id', { preHandler: writePreHandler }, async (request, reply) => {
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
