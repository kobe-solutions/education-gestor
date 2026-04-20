import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { createSubjectBodySchema } from './subjects.schema'
import { createSubjectService } from './subjects.service'

export async function subjectsRoutes(app: FastifyInstance) {
  app.post(
    '/subjects',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin', 'gestor'])] },
    async (request, reply) => {
      try {
        const payload = request.user as { schoolId: string }
        const body = createSubjectBodySchema.parse(request.body)

        const subject = await createSubjectService({
          schoolId: payload.schoolId,
          name: body.name,
          code: body.code,
          weeklyHours: body.weeklyHours,
        })

        return reply.status(201).send(subject)
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.status(400).send({
            message: 'Validation error',
            issues: error.issues,
          })
        }

        if (error instanceof Error && error.message === 'Subject already exists with this name') {
          return reply.status(409).send({ message: error.message })
        }

        if (error instanceof Error && error.message === 'Subject already exists with this code') {
          return reply.status(409).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
