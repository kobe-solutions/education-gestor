import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { loginBodySchema } from './auth.schema'
import { authenticateService } from './auth.service'

export async function authRoutes(app: FastifyInstance) {
  app.post('/sessions', async (request, reply) => {
    try {
      const body = loginBodySchema.parse(request.body)
      const authPayload = await authenticateService({
        email: body.email,
        password: body.password,
      })

      const accessToken = await reply.jwtSign(authPayload)
      return reply.send({ accessToken })
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          issues: error.issues,
        })
      }

      if (error instanceof Error && error.message === 'Invalid credentials') {
        return reply.status(401).send({ message: error.message })
      }

      throw error
    }
  })
}
