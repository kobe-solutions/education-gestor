import type { FastifyInstance } from 'fastify'
import { loginBodySchema } from './auth.schema'
import { authenticateService } from './auth.service'
import { loginRateLimitConfig } from '../../middlewares/rateLimit'
import { errorHandler } from '../../lib/responseHandlers'

export async function authRoutes(app: FastifyInstance) {
  app.post('/sessions', { config: { rateLimit: loginRateLimitConfig } }, async (request, reply) => {
    try {
      const body = loginBodySchema.parse(request.body)
      const authPayload = await authenticateService({ email: body.email, password: body.password })
      const accessToken = await reply.jwtSign(authPayload)
      return reply.send({ accessToken })
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        // return reply.status(401).send({ message: error.message })
        return errorHandler(reply, "Credenciais invalida. Verifique as informações e tente novamente.", 401)
      }
      return errorHandler(reply, "Erro interno do servidor.", 500)
    }
  })
}
