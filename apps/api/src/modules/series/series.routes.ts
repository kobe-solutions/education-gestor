import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { getSchoolId } from '../../lib/routeHelpers'
import { createSerieBodySchema, updateSerieBodySchema } from './series.schema'
import {
  createSerieService,
  listSeriesService,
  getSerieService,
  updateSerieService,
  deleteSerieService,
} from './series.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor'])]

export async function seriesRoutes(app: FastifyInstance) {
  app.get('/series', { preHandler }, async (request, reply) => {
    const { educationLevelId } = request.query as { educationLevelId?: string }
    return reply.send(await listSeriesService(getSchoolId(request), educationLevelId))
  })

  app.get('/series/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getSerieService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Serie not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/series', { preHandler }, async (request, reply) => {
    try {
      const body = createSerieBodySchema.parse(request.body)
      const serie = await createSerieService({ schoolId: getSchoolId(request), ...body })
      return reply.status(201).send(serie)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Education level not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Serie already exists with this name in this level') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/series/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateSerieBodySchema.parse(request.body)
      return reply.send(await updateSerieService(getSchoolId(request), id, body))
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Serie not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Serie already exists with this name in this level') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/series/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteSerieService(getSchoolId(request), id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Serie not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}
