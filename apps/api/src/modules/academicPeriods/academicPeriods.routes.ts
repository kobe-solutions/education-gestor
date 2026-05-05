import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { TenantPayload } from '../../middlewares/authorize'
import { createAcademicPeriodBodySchema, updateAcademicPeriodBodySchema } from './academicPeriods.schema'
import {
  listAcademicPeriodsService,
  getAcademicPeriodService,
  createAcademicPeriodService,
  updateAcademicPeriodService,
  deleteAcademicPeriodService,
} from './academicPeriods.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

function getSchoolId(request: { user: unknown }): string {
  const payload = request.user as TenantPayload
  return payload.schoolId
}

export async function academicPeriodsRoutes(app: FastifyInstance) {
  app.get('/academic-periods', { preHandler }, async (request, reply) => {
    const schoolId = getSchoolId(request)
    return reply.send(await listAcademicPeriodsService(schoolId))
  })

  app.get('/academic-periods/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      return reply.send(await getAcademicPeriodService(schoolId, id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Academic period not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/academic-periods', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const body = createAcademicPeriodBodySchema.parse(request.body)
      const period = await createAcademicPeriodService({ schoolId, ...body })
      return reply.status(201).send(period)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      throw error
    }
  })

  app.put('/academic-periods/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const body = updateAcademicPeriodBodySchema.parse(request.body)
      return reply.send(await updateAcademicPeriodService(schoolId, id, body))
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error && error.message === 'Academic period not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/academic-periods/:id', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      await deleteAcademicPeriodService(schoolId, id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Academic period not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}
