import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { TenantPayload } from '../../middlewares/authorize'
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
  addTeacherToClassService,
  addStudentToClassService,
  removeStudentFromClassService,
} from './schoolClasses.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

function getSchoolId(request: { user: unknown }): string {
  const payload = request.user as TenantPayload
  return payload.schoolId
}

export async function schoolClassesRoutes(app: FastifyInstance) {
  app.get('/school-classes', { preHandler }, async (request, reply) => {
    const schoolId = getSchoolId(request)
    return reply.send(await listSchoolClassesService(schoolId))
  })

  app.get('/school-classes/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      return reply.send(await getSchoolClassService(schoolId, id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/school-classes', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const body = createSchoolClassBodySchema.parse(request.body)
      const schoolClass = await createSchoolClassService({ schoolId, ...body })
      return reply.status(201).send(schoolClass)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      throw error
    }
  })

  app.put('/school-classes/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const body = updateSchoolClassBodySchema.parse(request.body)
      return reply.send(await updateSchoolClassService(schoolId, id, body))
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/school-classes/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      await deleteSchoolClassService(schoolId, id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/school-classes/:id/teachers', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const body = addMemberBodySchema.parse(request.body)
      const link = await addTeacherToClassService(schoolId, id, body.id)
      return reply.status(201).send(link)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error) {
        if (error.message === 'Class not found' || error.message === 'Teacher not found') {
          return reply.status(404).send({ message: error.message })
        }
        if (error.message === 'Teacher already in class') {
          return reply.status(409).send({ message: error.message })
        }
      }
      throw error
    }
  })

  app.post('/school-classes/:id/students', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const body = addMemberBodySchema.parse(request.body)
      const link = await addStudentToClassService(schoolId, id, body.id)
      return reply.status(201).send(link)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error) {
        if (error.message === 'Class not found' || error.message === 'Student not found') {
          return reply.status(404).send({ message: error.message })
        }
        if (error.message === 'Student already in class') {
          return reply.status(409).send({ message: error.message })
        }
      }
      throw error
    }
  })

  app.delete('/school-classes/:classId/students/:studentId', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { classId, studentId } = request.params as { classId: string; studentId: string }
      await removeStudentFromClassService(schoolId, classId, studentId)
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
