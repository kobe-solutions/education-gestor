import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import type { JwtPayload, TenantPayload } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { getSchoolId } from '../../lib/routeHelpers'
import { createTimetableSlotBodySchema, createTimetableSlotsBatchBodySchema, updateTimetableSlotBodySchema } from './timetable.schema'
import {
  createTimetableSlotService,
  createTimetableSlotsBatchService,
  listTimetableSlotsService,
  listAllTimetableSlotsService,
  getTimetableSlotService,
  updateTimetableSlotService,
  deleteTimetableSlotService,
} from './timetable.service'
import { listTimetableSlotsByTeacherRepository } from './timetable.repository'
import { handleRouteError, successHandler } from '../../lib/responseHandlers'

const readPreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor', 'professor'])]
const writePreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor', 'professor'])]

export async function timetableRoutes(app: FastifyInstance) {
  app.get('/timetable-slots', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const { classId } = request.query as { classId?: string }
      const user = request.user as JwtPayload
      const schoolId = getSchoolId(request)

      if (user.role === 'professor' && !classId) {
        const teacherId = (user as TenantPayload).userId
        const slots = await listTimetableSlotsByTeacherRepository(schoolId, teacherId)
        return successHandler(reply, 'Horários carregados com sucesso.', 200, slots)
      }

      const slots = !classId
        ? await listAllTimetableSlotsService(schoolId)
        : await listTimetableSlotsService(schoolId, classId)
      return successHandler(reply, 'Horários carregados com sucesso.', 200, slots)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar os horários. Confira as informações e tente novamente.')
    }
  })

  app.get('/timetable-slots/:id', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const slot = await getTimetableSlotService(getSchoolId(request), id)
      return successHandler(reply, 'Horário carregado com sucesso.', 200, slot)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar o horário.', [
        { message: 'Timetable slot not found', status: 404 },
      ])
    }
  })

  app.post('/timetable-slots', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const body = createTimetableSlotBodySchema.parse(request.body)
      const slot = await createTimetableSlotService(getSchoolId(request), body)
      return successHandler(reply, 'Horário criado com sucesso.', 201, slot)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do horário são inválidos.', [
        { message: 'Teacher already has a slot at this time', status: 409, responseMessage: 'O professor já possui aula neste horário.' },
      ])
    }
  })

  app.post('/timetable-slots/batch', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const body = createTimetableSlotsBatchBodySchema.parse(request.body)
      const slots = await createTimetableSlotsBatchService(getSchoolId(request), body)
      return successHandler(reply, 'Horários criados com sucesso.', 201, { created: slots.length })
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados dos horários são inválidos.', [
        { message: 'Teacher already has a slot at this time', status: 409, responseMessage: 'O professor já tem aula em um ou mais horários selecionados. Revise os dias e horários.' },
        { message: 'Class period not found', status: 400, responseMessage: 'Um dos horários selecionados não está mais disponível. Atualize a página e tente novamente.' },
      ])
    }
  })

  app.put('/timetable-slots/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateTimetableSlotBodySchema.parse(request.body)
      const slot = await updateTimetableSlotService(getSchoolId(request), id, body)
      return successHandler(reply, 'Horário atualizado com sucesso.', 200, slot)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do horário são inválidos.', [
        { message: 'Timetable slot not found', status: 404 },
        { message: 'Teacher already has a slot at this time', status: 409, responseMessage: 'O professor já possui aula neste horário.' },
      ])
    }
  })

  app.delete('/timetable-slots/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteTimetableSlotService(getSchoolId(request), id)
      return successHandler(reply, 'Horário excluído com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível excluir o horário.', [
        { message: 'Timetable slot not found', status: 404 },
      ])
    }
  })
}
