import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { createSchoolService } from './schools.service'
import { createSchoolBodySchema } from './schools.schema'

export async function schoolsRoutes(app: FastifyInstance) {
  async function createSchoolManagerHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = createSchoolBodySchema.parse(request.body)

      const school = await createSchoolService({
        name: body.name,
        slug: body.slug,
        email: body.email,
        password: body.password,
      })

      return reply.status(201).send(school)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          issues: error.issues,
        })
      }

      if (error instanceof Error && error.message === 'School already exists with this slug or email') {
        return reply.status(409).send({ message: error.message })
      }

      throw error
    }
  }

  app.post('/schools', createSchoolManagerHandler)
  app.post('/schools/users/management', createSchoolManagerHandler)
}
