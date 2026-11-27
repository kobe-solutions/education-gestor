import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId, MissingTenantError } from '../../lib/routeHelpers'
import { db } from '../../db'
import { academicPeriods } from '../../db/schema'
import { createAcademicPeriodBodySchema, updateAcademicPeriodBodySchema } from './academicPeriods.schema'
import { errorHandler, successHandler } from '../../lib/responseHandlers'
import {
  listAcademicPeriodsService,
  getAcademicPeriodService,
  createAcademicPeriodService,
  updateAcademicPeriodService,
  deleteAcademicPeriodService,
} from './academicPeriods.service'

const writeHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]
const readHandler = [authenticate, injectTenant]

function handleAcademicPeriodError(
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

  if (error instanceof Error && error.message === 'Academic period not found') {
    return errorHandler(reply, 'O período letivo informado não foi encontrado.', 404)
  }

  if (error instanceof Error && error.message.startsWith('Período sobrepõe com')) {
    return errorHandler(reply, 'As datas informadas se sobrepõem a outro período letivo.', 409)
  }

  if (error instanceof Error && error.name === 'ZodError') {
    return errorHandler(reply, invalidMessage, 400)
  }

  return errorHandler(reply, 'Erro interno no servidor.', 500)
}

export async function academicPeriodsRoutes(app: FastifyInstance) {
  app.get(
    '/academic-periods',
    { preHandler: readHandler },
    async (request, reply) => {
      try {
        const schoolId = getSchoolId(request)
        const periods = await db
          .select({
            id: academicPeriods.id,
            schoolId: academicPeriods.schoolId,
            academicYearId: academicPeriods.academicYearId,
            name: academicPeriods.name,
            type: academicPeriods.type,
            order: academicPeriods.order,
            startDate: academicPeriods.startDate,
            endDate: academicPeriods.endDate,
            gradeClosingDate: academicPeriods.gradeClosingDate,
            createdAt: academicPeriods.createdAt,
            updatedAt: academicPeriods.updatedAt,
          })
          .from(academicPeriods)
          .where(eq(academicPeriods.schoolId, schoolId))
        return successHandler(reply, 'Períodos letivos carregados com sucesso.', 200, periods)
      } catch (error) {
        return handleAcademicPeriodError(
          error,
          reply,
          'Os dados do período letivo são inválidos. Confira os campos e tente novamente.',
        )
      }
    },
  )

  app.get(
    '/academic-years/:yearId/periods',
    { preHandler: readHandler },
    async (request, reply) => {
      try {
        const { yearId } = request.params as { yearId: string }
        const periods = await listAcademicPeriodsService(getSchoolId(request), yearId)
        return successHandler(reply, 'Períodos do ano letivo carregados com sucesso.', 200, periods)
      } catch (error) {
        return handleAcademicPeriodError(
          error,
          reply,
          'Os dados do ano letivo são inválidos. Confira as informações e tente novamente.',
        )
      }
    },
  )

  app.get(
    '/academic-years/:yearId/periods/:id',
    { preHandler: readHandler },
    async (request, reply) => {
      try {
        const { yearId, id } = request.params as { yearId: string; id: string }
        const period = await getAcademicPeriodService(getSchoolId(request), yearId, id)
        return successHandler(reply, 'Período letivo carregado com sucesso.', 200, period)
      } catch (error) {
        return handleAcademicPeriodError(
          error,
          reply,
          'Os dados do período letivo são inválidos. Confira as informações e tente novamente.',
        )
      }
    },
  )

  app.post(
    '/academic-years/:yearId/periods',
    { preHandler: writeHandler },
    async (request, reply) => {
      try {
        const { yearId } = request.params as { yearId: string }
        const body = createAcademicPeriodBodySchema.parse(request.body)
        const period = await createAcademicPeriodService(getSchoolId(request), yearId, body)
        return successHandler(reply, 'Período letivo criado com sucesso.', 201, period)
      } catch (error) {
        return handleAcademicPeriodError(
          error,
          reply,
          'Os dados do período letivo são inválidos. Confira os campos e tente novamente.',
        )
      }
    },
  )

  app.put(
    '/academic-years/:yearId/periods/:id',
    { preHandler: writeHandler },
    async (request, reply) => {
      try {
        const { yearId, id } = request.params as { yearId: string; id: string }
        const body = updateAcademicPeriodBodySchema.parse(request.body)
        const period = await updateAcademicPeriodService(getSchoolId(request), yearId, id, body)
        return successHandler(reply, 'Período letivo atualizado com sucesso.', 200, period)
      } catch (error) {
        return handleAcademicPeriodError(
          error,
          reply,
          'Os dados do período letivo são inválidos. Confira os campos e tente novamente.',
        )
      }
    },
  )

  app.delete(
    '/academic-years/:yearId/periods/:id',
    { preHandler: writeHandler },
    async (request, reply) => {
      try {
        const { yearId, id } = request.params as { yearId: string; id: string }
        await deleteAcademicPeriodService(getSchoolId(request), yearId, id)
        return successHandler(reply, 'Período letivo excluído com sucesso.', 200, null)
      } catch (error) {
        return handleAcademicPeriodError(
          error,
          reply,
          'Não foi possível excluir o período letivo. Confira as informações e tente novamente.',
        )
      }
    },
  )
}
