import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { getSchoolId } from '../../lib/routeHelpers'
import { handleRouteError, successHandler } from '../../lib/responseHandlers'
import { createSubjectBodySchema, updateSubjectBodySchema } from './subjects.schema'
import {
  createSubjectService,
  listSubjectsService,
  getSubjectService,
  updateSubjectService,
  deleteSubjectService,
} from './subjects.service'

const readPreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor', 'professor'])]
const writePreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor'])]

export async function subjectsRoutes(app: FastifyInstance) {
  app.get('/subjects', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const subjects = await listSubjectsService(getSchoolId(request))
      return successHandler(reply, 'Disciplinas carregadas com sucesso.', 200, subjects)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar as disciplinas.')
    }
  })

  app.get('/subjects/:id', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const subject = await getSubjectService(getSchoolId(request), id)
      return successHandler(reply, 'Disciplina carregada com sucesso.', 200, subject)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar a disciplina.', [
        { message: 'Subject not found', status: 404 },
      ])
    }
  })

  app.post('/subjects', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const body = createSubjectBodySchema.parse(request.body)
      const subject = await createSubjectService({ schoolId: getSchoolId(request), ...body })
      return successHandler(reply, 'Disciplina criada com sucesso.', 201, subject)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da disciplina são inválidos.', [
        { message: 'Subject already exists with this name', status: 409, responseMessage: 'Já existe uma disciplina com este nome.' },
        { message: 'Subject already exists with this code', status: 409, responseMessage: 'Já existe uma disciplina com este código.' },
      ])
    }
  })

  app.put('/subjects/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateSubjectBodySchema.parse(request.body)
      const subject = await updateSubjectService(getSchoolId(request), id, body)
      return successHandler(reply, 'Disciplina atualizada com sucesso.', 200, subject)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da disciplina são inválidos.', [
        { message: 'Subject not found', status: 404 },
        { message: 'Subject already exists with this name', status: 409, responseMessage: 'Já existe uma disciplina com este nome.' },
      ])
    }
  })

  app.delete('/subjects/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteSubjectService(getSchoolId(request), id)
      return successHandler(reply, 'Disciplina excluída com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível excluir a disciplina.', [
        { message: 'Subject not found', status: 404 },
      ])
    }
  })
}
