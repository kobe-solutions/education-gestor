import type { FastifyInstance } from 'fastify'
import { loginBodySchema } from './auth.schema'
import { authenticateService } from './auth.service'
import { loginRateLimitConfig } from '../../middlewares/rateLimit'
import { errorHandler } from '../../lib/responseHandlers'

export async function authRoutes(app: FastifyInstance) {
  app.post('/sessions', { config: { rateLimit: loginRateLimitConfig } }, async (request, reply) => {
    const body = loginBodySchema.parse(request.body)
    try {
      const authPayload = await authenticateService({ email: body.email, password: body.password })
      const accessToken = await reply.jwtSign(authPayload)
      return reply.send({ accessToken })
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        return errorHandler(reply, 'Credenciais inválidas. Verifique as informações e tente novamente.', 401)
      }
      request.log.error({ err: error }, 'Login failed')
      return errorHandler(reply, 'Erro interno do servidor.', 500)
    }
  })
}
