import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { env } from './env'
import { authRoutes } from './modules/auth/auth.routes'
import { schoolsRoutes } from './modules/schools/schools.routes'
import { subjectsRoutes } from './modules/subjects/subjects.routes'
import { teachersRoutes } from './modules/teachers/teachers.routes'

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development',
  })

  app.register(fastifyCors, { origin: true })
  app.register(fastifyJwt, { secret: env.JWT_SECRET })
  app.register(authRoutes)
  app.register(schoolsRoutes)
  app.register(subjectsRoutes)
  app.register(teachersRoutes)

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
