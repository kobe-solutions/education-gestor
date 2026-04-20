import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { createTeacherBodySchema } from './teachers.schema'
import { createTeacherService } from './teachers.service'

export async function teachersRoutes(app: FastifyInstance) {
  app.post(
    '/teachers',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin', 'gestor'])] },
    async (request, reply) => {
    try {
      const payload = request.user as { schoolId: string }

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
        return reply.status(400).send({
          message: 'Validation error',
          issues: error.issues,
        })
      }

      if (error instanceof Error && error.message === 'Teacher already exists with this email') {
        return reply.status(409).send({ message: error.message })
      }

      throw error
    }
    },
  )
}
