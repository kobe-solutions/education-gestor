import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { env } from './env'

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development',
  })

  app.register(fastifyCors, { origin: true })
  app.register(fastifyJwt, { secret: env.JWT_SECRET })

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
