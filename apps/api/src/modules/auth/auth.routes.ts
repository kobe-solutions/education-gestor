import type { FastifyInstance } from 'fastify'
import { loginBodySchema } from './auth.schema'
import { authenticateService } from './auth.service'

export async function authRoutes(app: FastifyInstance) {
  app.post('/sessions', async (request, reply) => {
    try {
      const body = loginBodySchema.parse(request.body)
      const authPayload = await authenticateService({ email: body.email, password: body.password })
      const accessToken = await reply.jwtSign(authPayload)
      return reply.send({ accessToken })
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        return reply.status(401).send({ message: error.message })
      }
      throw error
    }
  })
}
