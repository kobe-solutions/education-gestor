import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { TenantPayload } from '../../middlewares/authorize'
import { createTeacherBodySchema, updateTeacherBodySchema } from './teachers.schema'
import {
  createTeacherService,
  listTeachersService,
  getTeacherService,
  updateTeacherService,
  deleteTeacherService,
} from './teachers.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

function getSchoolId(request: { user: unknown }): string {
  const payload = request.user as TenantPayload
  return payload.schoolId
}

export async function teachersRoutes(app: FastifyInstance) {
  app.get('/teachers', { preHandler }, async (request, reply) => {
    const schoolId = getSchoolId(request)
    const result = await listTeachersService(schoolId)
    return reply.send(result)
  })

  app.get('/teachers/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const teacher = await getTeacherService(schoolId, id)
      return reply.send(teacher)
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post(
    '/teachers',
    { preHandler },
    async (request, reply) => {
      try {
        const payload = request.user as TenantPayload
        const body = createTeacherBodySchema.parse(request.body)
        const teacher = await createTeacherService({
          schoolId: payload.schoolId,
          name: body.name,
          email: body.email,
          password: body.password,
        })
        return reply.status(201).send(teacher)
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.status(400).send({ message: 'Validation error', issues: error.issues })
        }
        if (error instanceof Error && error.message === 'Teacher already exists with this email') {
          return reply.status(409).send({ message: error.message })
        }
        throw error
      }
    },
  )

  app.put('/teachers/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const body = updateTeacherBodySchema.parse(request.body)
      const teacher = await updateTeacherService(schoolId, id, body)
      return reply.send(teacher)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/teachers/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      await deleteTeacherService(schoolId, id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}
