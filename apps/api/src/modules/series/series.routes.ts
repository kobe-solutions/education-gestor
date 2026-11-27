import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { getSchoolId } from '../../lib/routeHelpers'
import { handleRouteError, successHandler } from '../../lib/responseHandlers'
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
    try {
      const series = await listSeriesService(getSchoolId(request), educationLevelId)
      return successHandler(reply, 'Séries carregadas com sucesso.', 200, series)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar as séries.')
    }
  })

  app.get('/series/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const serie = await getSerieService(getSchoolId(request), id)
      return successHandler(reply, 'Série carregada com sucesso.', 200, serie)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar a série.', [
        { message: 'Serie not found', status: 404 },
      ])
    }
  })

  app.post('/series', { preHandler }, async (request, reply) => {
    try {
      const body = createSerieBodySchema.parse(request.body)
      const serie = await createSerieService({ schoolId: getSchoolId(request), ...body })
      return successHandler(reply, 'Série criada com sucesso.', 201, serie)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da série são inválidos.', [
        { message: 'Education level not found', status: 404, responseMessage: 'O nível de ensino informado não foi encontrado.' },
        { message: 'Serie already exists with this name in this level', status: 409, responseMessage: 'Já existe uma série com este nome neste nível de ensino.' },
      ])
    }
  })

  app.put('/series/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateSerieBodySchema.parse(request.body)
      const serie = await updateSerieService(getSchoolId(request), id, body)
      return successHandler(reply, 'Série atualizada com sucesso.', 200, serie)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da série são inválidos.', [
        { message: 'Serie not found', status: 404 },
        { message: 'Serie already exists with this name in this level', status: 409, responseMessage: 'Já existe uma série com este nome neste nível de ensino.' },
      ])
    }
  })

  app.delete('/series/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteSerieService(getSchoolId(request), id)
      return successHandler(reply, 'Série excluída com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível excluir a série.', [
        { message: 'Serie not found', status: 404 },
      ])
    }
  })
}
