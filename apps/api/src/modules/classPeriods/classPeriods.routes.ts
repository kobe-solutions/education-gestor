import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId, MissingTenantError } from '../../lib/routeHelpers'
import { errorHandler, successHandler } from '../../lib/responseHandlers'
import { createClassPeriodBodySchema, updateClassPeriodBodySchema } from './classPeriods.schema'
import {
  listClassPeriodsService,
  getClassPeriodService,
  createClassPeriodService,
  updateClassPeriodService,
  deleteClassPeriodService,
} from './classPeriods.service'

const writeHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]
const readHandler = [authenticate, injectTenant]

function handleClassPeriodError(
  error: unknown,
  reply: Parameters<typeof errorHandler>[0],
  invalidMessage: string,
) {
  if (error instanceof MissingTenantError) {
    return errorHandler(
      reply,
      'Não foi possível identificar a escola ativa. Selecione uma escola e tente novamente.',
      400,
    )
  }

  if (error instanceof Error) {
    if (error.name === 'ZodError') {
      return errorHandler(reply, invalidMessage, 400)
    }
    if (error.message === 'Class period not found') {
      return errorHandler(reply, 'O período de aula informado não foi encontrado.', 404)
    }
    if (error.message.includes('Não é possível excluir')) {
      return errorHandler(reply, error.message, 409)
    }
  }

  const databaseError = error as { code?: string; constraint?: string }
  if (
    databaseError.code === '23505' &&
    databaseError.constraint?.includes('class_periods_school_order_unique')
  ) {
    return errorHandler(reply, 'Já existe um período de aula com esta ordem nesta escola.', 409)
  }

  return errorHandler(reply, 'Erro interno no servidor.', 500)
}

export async function classPeriodsRoutes(app: FastifyInstance) {
  app.get('/class-periods', { preHandler: readHandler }, async (request, reply) => {
    try {
      const periods = await listClassPeriodsService(getSchoolId(request))
      return successHandler(reply, 'Períodos de aula carregados com sucesso.', 200, periods)
    } catch (error) {
      return handleClassPeriodError(
        error,
        reply,
        'Não foi possível carregar os períodos de aula. Confira as informações e tente novamente.',
      )
    }
  })

  app.get('/class-periods/:id', { preHandler: readHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const period = await getClassPeriodService(getSchoolId(request), id)
      return successHandler(reply, 'Período de aula carregado com sucesso.', 200, period)
    } catch (error) {
      return handleClassPeriodError(
        error,
        reply,
        'Não foi possível carregar o período de aula. Confira as informações e tente novamente.',
      )
    }
  })

  app.post('/class-periods', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const body = createClassPeriodBodySchema.parse(request.body)
      const period = await createClassPeriodService(getSchoolId(request), body)
      return successHandler(reply, 'Período de aula criado com sucesso.', 201, period)
    } catch (error) {
      return handleClassPeriodError(
        error,
        reply,
        'Os dados do período de aula são inválidos. Confira os campos e tente novamente.',
      )
    }
  })

  app.put('/class-periods/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateClassPeriodBodySchema.parse(request.body)
      const period = await updateClassPeriodService(getSchoolId(request), id, body)
      return successHandler(reply, 'Período de aula atualizado com sucesso.', 200, period)
    } catch (error) {
      return handleClassPeriodError(
        error,
        reply,
        'Os dados do período de aula são inválidos. Confira os campos e tente novamente.',
      )
    }
  })

  app.delete('/class-periods/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteClassPeriodService(getSchoolId(request), id)
      return successHandler(reply, 'Período de aula excluído com sucesso.', 200, null)
    } catch (error) {
      return handleClassPeriodError(
        error,
        reply,
        'Não foi possível excluir o período de aula. Confira as informações e tente novamente.',
      )
    }
  })
}
