import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import {
  createSchoolClassBodySchema,
  updateSchoolClassBodySchema,
  addMemberBodySchema,
} from './schoolClasses.schema'
import {
  listSchoolClassesService,
  getSchoolClassService,
  createSchoolClassService,
  updateSchoolClassService,
  deleteSchoolClassService,
  addStudentToClassService,
  removeStudentFromClassService,
  listStudentClassesService,
} from './schoolClasses.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function schoolClassesRoutes(app: FastifyInstance) {
  app.get('/school-classes', { preHandler }, async (request, reply) => {
    return reply.send(await listSchoolClassesService(getSchoolId(request)))
  })

  app.get('/school-classes/students/:studentId', { preHandler }, async (request, reply) => {
    const { studentId } = request.params as { studentId: string }
    return reply.send(await listStudentClassesService(getSchoolId(request), studentId))
  })

  app.get('/school-classes/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getSchoolClassService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/school-classes', { preHandler }, async (request, reply) => {
    const body = createSchoolClassBodySchema.parse(request.body)
    const schoolClass = await createSchoolClassService({ schoolId: getSchoolId(request), ...body })
    return reply.status(201).send(schoolClass)
  })

  app.put('/school-classes/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateSchoolClassBodySchema.parse(request.body)
      return reply.send(await updateSchoolClassService(getSchoolId(request), id, body))
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/school-classes/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteSchoolClassService(getSchoolId(request), id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/school-classes/:id/students', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = addMemberBodySchema.parse(request.body)
      const link = await addStudentToClassService(getSchoolId(request), id, body.id)
      return reply.status(201).send(link)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Class not found' || error.message === 'Student not found') {
          return reply.status(404).send({ message: error.message })
        }
        if (error.message === 'Student already in class' || error.message === 'Class is full') {
          return reply.status(409).send({ message: error.message })
        }
      }
      throw error
    }
  })

  app.delete('/school-classes/:classId/students/:studentId', { preHandler }, async (request, reply) => {
    try {
      const { classId, studentId } = request.params as { classId: string; studentId: string }
      await removeStudentFromClassService(getSchoolId(request), classId, studentId)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Class not found' || error.message === 'Student not in class') {
          return reply.status(404).send({ message: error.message })
        }
      }
      throw error
    }
  })
}
