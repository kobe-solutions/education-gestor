import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { TenantPayload } from '../../middlewares/authorize'
import {
  createStudentBodySchema,
  updateStudentBodySchema,
  createGuardianBodySchema,
} from './students.schema'
import {
  listStudentsService,
  getStudentService,
  createStudentService,
  updateStudentService,
  deleteStudentService,
  addGuardianService,
  listGuardiansService,
} from './students.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

function getSchoolId(request: { user: unknown }): string {
  const payload = request.user as TenantPayload
  return payload.schoolId
}

export async function studentsRoutes(app: FastifyInstance) {
  app.get('/students', { preHandler }, async (request, reply) => {
    const schoolId = getSchoolId(request)
    const result = await listStudentsService(schoolId)
    return reply.send(result)
  })

  app.get('/students/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const student = await getStudentService(schoolId, id)
      return reply.send(student)
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/students', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const body = createStudentBodySchema.parse(request.body)
      const student = await createStudentService({ schoolId, ...body })
      return reply.status(201).send(student)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error && error.message === 'Enrollment code already in use') {
        return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/students/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const body = updateStudentBodySchema.parse(request.body)
      const student = await updateStudentService(schoolId, id, body)
      return reply.send(student)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error) {
        if (error.message === 'Student not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Enrollment code already in use') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/students/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      await deleteStudentService(schoolId, id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.get('/students/:id/guardians', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const result = await listGuardiansService(schoolId, id)
      return reply.send(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/students/:id/guardians', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const body = createGuardianBodySchema.parse(request.body)
      const guardian = await addGuardianService({ studentId: id, schoolId, ...body })
      return reply.status(201).send(guardian)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}
