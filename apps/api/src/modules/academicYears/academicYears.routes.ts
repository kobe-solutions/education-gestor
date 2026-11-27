import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId, MissingTenantError } from '../../lib/routeHelpers'
import {
  createAcademicYearBodySchema,
  updateAcademicYearBodySchema,
  updateAcademicYearStatusBodySchema,
} from './academicYears.schema'
import {
  listAcademicYearsService,
  getAcademicYearService,
  getActiveAcademicYearService,
  createAcademicYearService,
  updateAcademicYearService,
  updateAcademicYearStatusService,
  deleteAcademicYearService,
} from './academicYears.service'
import { errorHandler, successHandler } from '../../lib/responseHandlers'

const writeHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]
const readHandler = [authenticate, injectTenant]

function handleAcademicYearError(
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
    if (error.message === 'Academic year not found') {
      return errorHandler(reply, 'O ano letivo informado não foi encontrado.', 404)
    }
    if (error.message === 'No active academic year') {
      return errorHandler(reply, 'Não há um ano letivo ativo cadastrado para esta escola.', 404)
    }
    if (error.message === 'Já existe um ano letivo ativo nesta escola') {
      return errorHandler(reply, 'Esta escola já possui outro ano letivo ativo.', 409)
    }
    if (error.message === 'Cannot delete an active academic year') {
      return errorHandler(reply, 'Não é possível excluir um ano letivo que está ativo.', 409)
    }
    if (error.name === 'ZodError') {
      return errorHandler(reply, invalidMessage, 400)
    }
  }

  return errorHandler(reply, 'Erro interno no servidor.', 500)
}

export async function academicYearsRoutes(app: FastifyInstance) {
  app.get('/academic-years', { preHandler: readHandler }, async (request, reply) => {
    try {
      const years = await listAcademicYearsService(getSchoolId(request))
      return successHandler(reply, 'Anos letivos carregados com sucesso.', 200, years)
    } catch (error) {
      return handleAcademicYearError(
        error,
        reply,
        'Não foi possível carregar os anos letivos. Confira as informações e tente novamente.',
      )
    }
  })

  app.get('/academic-years/active', { preHandler: readHandler }, async (request, reply) => {
    try {
      const year = await getActiveAcademicYearService(getSchoolId(request))
      return successHandler(reply, 'Ano letivo ativo carregado com sucesso.', 200, year)
    } catch (error) {
      return handleAcademicYearError(
        error,
        reply,
        'Não foi possível carregar o ano letivo ativo. Confira as informações e tente novamente.',
      )
    }
  })

  app.get('/academic-years/:id', { preHandler: readHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const year = await getAcademicYearService(getSchoolId(request), id)
      return successHandler(reply, 'Ano letivo carregado com sucesso.', 200, year)
    } catch (error) {
      return handleAcademicYearError(
        error,
        reply,
        'Não foi possível carregar o ano letivo. Confira as informações e tente novamente.',
      )
    }
  })

  app.post('/academic-years', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const body = createAcademicYearBodySchema.parse(request.body)
      const year = await createAcademicYearService(getSchoolId(request), body)
      return successHandler(reply, 'Ano letivo criado com sucesso.', 201, year)
    } catch (error) {
      return handleAcademicYearError(
        error,
        reply,
        'Os dados do ano letivo são inválidos. Confira os campos e tente novamente.',
      )
    }
  })

  app.put('/academic-years/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateAcademicYearBodySchema.parse(request.body)
      const year = await updateAcademicYearService(getSchoolId(request), id, body)
      return successHandler(reply, 'Ano letivo atualizado com sucesso.', 200, year)
    } catch (error) {
      return handleAcademicYearError(
        error,
        reply,
        'Os dados do ano letivo são inválidos. Confira os campos e tente novamente.',
      )
    }
  })

  app.patch('/academic-years/:id/status', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateAcademicYearStatusBodySchema.parse(request.body)
      const year = await updateAcademicYearStatusService(getSchoolId(request), id, body.status)
      return successHandler(reply, 'Status do ano letivo atualizado com sucesso.', 200, year)
    } catch (error) {
      return handleAcademicYearError(
        error,
        reply,
        'O status informado é inválido. Selecione uma opção disponível e tente novamente.',
      )
    }
  })

  app.delete('/academic-years/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteAcademicYearService(getSchoolId(request), id)
      return successHandler(reply, 'Ano letivo excluído com sucesso.', 200, null)
    } catch (error) {
      return handleAcademicYearError(
        error,
        reply,
        'Não foi possível excluir o ano letivo. Confira as informações e tente novamente.',
      )
    }
  })
}
