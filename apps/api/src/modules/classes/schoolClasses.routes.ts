import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId, MissingTenantError } from '../../lib/routeHelpers'
import { errorHandler, successHandler } from '../../lib/responseHandlers'
import {
  createSchoolClassBodySchema,
  updateSchoolClassBodySchema,
  addMemberBodySchema,
} from './schoolClasses.schema'
import {
  listSchoolClassesService,
  getSchoolClassService,
  createSchoolClassService,
  updateSchoolClassService,
  deleteSchoolClassService,
  addStudentToClassService,
  removeStudentFromClassService,
  listStudentClassesService,
} from './schoolClasses.service'

const readPreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor', 'professor'])]
const writePreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

function handleSchoolClassError(
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
    if (error.message === 'Class not found' || error.message === 'Student not found' || error.message === 'Student not in class') {
      const message = error.message === 'Student not in class'
        ? 'O aluno informado não está matriculado nesta turma.'
        : error.message === 'Student not found'
          ? 'O aluno informado não foi encontrado.'
          : 'A turma informada não foi encontrada.'
      return errorHandler(reply, message, 404)
    }
    if (
      error.message === 'Student already in class' ||
      error.message === 'Class is full' ||
      error.message.startsWith('Student already enrolled in class')
    ) {
      const message = error.message === 'Class is full'
        ? 'Esta turma atingiu o limite de alunos.'
        : 'O aluno já está matriculado em uma turma.'
      return errorHandler(reply, message, 409)
    }
  }

  return errorHandler(reply, 'Erro interno no servidor.', 500)
}

export async function schoolClassesRoutes(app: FastifyInstance) {
  app.get('/school-classes', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const classes = await listSchoolClassesService(getSchoolId(request))
      return successHandler(reply, 'Turmas carregadas com sucesso.', 200, classes)
    } catch (error) {
      return handleSchoolClassError(error, reply, 'Não foi possível carregar as turmas. Confira as informações e tente novamente.')
    }
  })

  app.get('/school-classes/students/:studentId', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const { studentId } = request.params as { studentId: string }
      const classes = await listStudentClassesService(getSchoolId(request), studentId)
      return successHandler(reply, 'Turmas do aluno carregadas com sucesso.', 200, classes)
    } catch (error) {
      return handleSchoolClassError(error, reply, 'Não foi possível carregar as turmas do aluno. Confira as informações e tente novamente.')
    }
  })

  app.get('/school-classes/:id', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const schoolClass = await getSchoolClassService(getSchoolId(request), id)
      return successHandler(reply, 'Turma carregada com sucesso.', 200, schoolClass)
    } catch (error) {
      return handleSchoolClassError(error, reply, 'Não foi possível carregar a turma. Confira as informações e tente novamente.')
    }
  })

  app.post('/school-classes', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const body = createSchoolClassBodySchema.parse(request.body)
      const schoolClass = await createSchoolClassService({ schoolId: getSchoolId(request), ...body })
      return successHandler(reply, 'Turma criada com sucesso.', 201, schoolClass)
    } catch (error) {
      return handleSchoolClassError(error, reply, 'Os dados da turma são inválidos. Confira os campos e tente novamente.')
    }
  })

  app.put('/school-classes/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateSchoolClassBodySchema.parse(request.body)
      const schoolClass = await updateSchoolClassService(getSchoolId(request), id, body)
      return successHandler(reply, 'Turma atualizada com sucesso.', 200, schoolClass)
    } catch (error) {
      return handleSchoolClassError(error, reply, 'Os dados da turma são inválidos. Confira os campos e tente novamente.')
    }
  })

  app.delete('/school-classes/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteSchoolClassService(getSchoolId(request), id)
      return successHandler(reply, 'Turma excluída com sucesso.', 200, null)
    } catch (error) {
      return handleSchoolClassError(error, reply, 'Não foi possível excluir a turma. Confira as informações e tente novamente.')
    }
  })

  app.post('/school-classes/:id/students', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = addMemberBodySchema.parse(request.body)
      const link = await addStudentToClassService(getSchoolId(request), id, body.id)
      return successHandler(reply, 'Aluno matriculado na turma com sucesso.', 201, link)
    } catch (error) {
      return handleSchoolClassError(error, reply, 'Os dados do aluno são inválidos. Confira as informações e tente novamente.')
    }
  })

  app.delete('/school-classes/:classId/students/:studentId', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { classId, studentId } = request.params as { classId: string; studentId: string }
      await removeStudentFromClassService(getSchoolId(request), classId, studentId)
      return successHandler(reply, 'Aluno removido da turma com sucesso.', 200, null)
    } catch (error) {
      return handleSchoolClassError(error, reply, 'Não foi possível remover o aluno da turma. Confira as informações e tente novamente.')
    }
  })
}
