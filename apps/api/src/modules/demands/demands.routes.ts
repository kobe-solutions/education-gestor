import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { handleRouteError, successHandler } from '../../lib/responseHandlers'
import { createDemandBodySchema, updateDemandBodySchema } from './demands.schema'
import {
  listDemandsService,
  getDemandService,
  createDemandService,
  updateDemandService,
  deleteDemandService,
} from './demands.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function demandsRoutes(app: FastifyInstance) {
  app.get('/demands', { preHandler }, async (request, reply) => {
    try {
      const { status } = request.query as { status?: string }
      const demands = await listDemandsService(getSchoolId(request), { status })
      return successHandler(reply, 'Solicitações carregadas com sucesso.', 200, demands)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar as solicitações.')
    }
  })

  app.get('/demands/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const demand = await getDemandService(id, getSchoolId(request))
      return successHandler(reply, 'Solicitação carregada com sucesso.', 200, demand)
    } catch (error: unknown) {
      return handleRouteError(reply, error, 'Não foi possível carregar a solicitação.', [
        { message: 'não encontrada', status: 404, includes: true },
      ])
    }
  })

  app.post('/demands', { preHandler }, async (request, reply) => {
    try {
      const body = createDemandBodySchema.parse(request.body)
      const demand = await createDemandService(body, getSchoolId(request))
      return successHandler(reply, 'Solicitação criada com sucesso.', 201, demand)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da solicitação são inválidos. Confira os campos e tente novamente.')
    }
  })

  app.patch('/demands/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const body = updateDemandBodySchema.parse(request.body)
      const demand = await updateDemandService(id, body, getSchoolId(request))
      return successHandler(reply, 'Solicitação atualizada com sucesso.', 200, demand)
    } catch (error: unknown) {
      return handleRouteError(reply, error, 'Os dados da solicitação são inválidos. Confira os campos e tente novamente.', [
        { message: 'não encontrada', status: 404, includes: true },
      ])
    }
  })

  app.delete('/demands/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteDemandService(id, getSchoolId(request))
      return successHandler(reply, 'Solicitação excluída com sucesso.', 200, null)
    } catch (error: unknown) {
      return handleRouteError(reply, error, 'Não foi possível excluir a solicitação.', [
        { message: 'não encontrada', status: 404, includes: true },
      ])
    }
  })
}
