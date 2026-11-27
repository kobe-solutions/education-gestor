import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { getSchoolId } from '../../lib/routeHelpers'
import { handleRouteError, successHandler } from '../../lib/responseHandlers'
import { createEducationLevelBodySchema, updateEducationLevelBodySchema } from './educationLevels.schema'
import {
  createEducationLevelService,
  listEducationLevelsService,
  getEducationLevelService,
  updateEducationLevelService,
  deleteEducationLevelService,
} from './educationLevels.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor'])]

export async function educationLevelsRoutes(app: FastifyInstance) {
  app.get('/education-levels', { preHandler }, async (request, reply) => {
    try {
      const levels = await listEducationLevelsService(getSchoolId(request))
      return successHandler(reply, 'Níveis de ensino carregados com sucesso.', 200, levels)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar os níveis de ensino.')
    }
  })

  app.get('/education-levels/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const level = await getEducationLevelService(getSchoolId(request), id)
      return successHandler(reply, 'Nível de ensino carregado com sucesso.', 200, level)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar o nível de ensino.', [
        { message: 'Education level not found', status: 404 },
      ])
    }
  })

  app.post('/education-levels', { preHandler }, async (request, reply) => {
    try {
      const body = createEducationLevelBodySchema.parse(request.body)
      const level = await createEducationLevelService({ schoolId: getSchoolId(request), ...body })
      return successHandler(reply, 'Nível de ensino criado com sucesso.', 201, level)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do nível de ensino são inválidos.', [
        { message: 'Education level already exists with this name', status: 409, responseMessage: 'Já existe um nível de ensino com este nome.' },
      ])
    }
  })

  app.put('/education-levels/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateEducationLevelBodySchema.parse(request.body)
      const level = await updateEducationLevelService(getSchoolId(request), id, body)
      return successHandler(reply, 'Nível de ensino atualizado com sucesso.', 200, level)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do nível de ensino são inválidos.', [
        { message: 'Education level not found', status: 404 },
        { message: 'Education level already exists with this name', status: 409, responseMessage: 'Já existe um nível de ensino com este nome.' },
      ])
    }
  })

  app.delete('/education-levels/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteEducationLevelService(getSchoolId(request), id)
      return successHandler(reply, 'Nível de ensino excluído com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível excluir o nível de ensino.', [
        { message: 'Education level not found', status: 404 },
      ])
    }
  })
}
