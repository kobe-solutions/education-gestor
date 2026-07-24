import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import {
  registerGradeBodySchema,
  registerAttendanceBodySchema,
  bulkAttendanceBodySchema,
} from './academic.schema'
import {
  registerGradeService,
  getStudentGradesService,
  getClassGradesService,
  registerAttendanceService,
  registerBulkAttendanceService,
  getStudentAttendancesService,
  getClassAttendanceByDateService,
} from './academic.service'

const preHandlerAll = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor', 'professor'])]
const preHandlerManage = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function academicRoutes(app: FastifyInstance) {
  app.post('/grades', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const body = registerGradeBodySchema.parse(request.body)
      const grade = await registerGradeService({ schoolId: getSchoolId(request), ...body })
      return reply.status(201).send(grade)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Class not found' || error.message === 'Student not found') {
          return reply.status(404).send({ message: error.message })
        }
      }
      throw error
    }
  })

  app.get('/students/:id/grades', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getStudentGradesService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.get('/school-classes/:id/grades', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getClassGradesService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/attendances', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const body = registerAttendanceBodySchema.parse(request.body)
      const attendance = await registerAttendanceService({ schoolId: getSchoolId(request), ...body })
      return reply.status(201).send(attendance)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Class not found' || error.message === 'Student not found') {
          return reply.status(404).send({ message: error.message })
        }
      }
      throw error
    }
  })

  app.post('/attendances/bulk', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const body = bulkAttendanceBodySchema.parse(request.body)
      const result = await registerBulkAttendanceService({ schoolId: getSchoolId(request), ...body })
      return reply.status(201).send(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.get('/students/:id/attendances', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getStudentAttendancesService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.get('/school-classes/:id/attendances', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { date } = request.query as { date?: string }

      if (!date) {
        return reply.status(400).send({ message: 'Query param "date" is required (YYYY-MM-DD)' })
      }

      return reply.send(await getClassAttendanceByDateService(getSchoolId(request), id, date))
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}
