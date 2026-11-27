import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles, type JwtPayload, type SecretariaPayload } from '../../middlewares/authorize'
import { logAudit } from '../../lib/audit'
import {
  createSchoolService,
  listSchoolsService,
  getSchoolService,
  updateSchoolService,
  changeSchoolPasswordService,
  toggleSchoolFinancialVisibilityService,
  uploadSchoolLogoServices,
  deleteSchoolService,
  permanentDeleteSchoolService,
} from './schools.service'
import { createSchoolBodySchema, updateSchoolBodySchema, changePasswordBodySchema } from './schools.schema'
import { validateImageFile, extFromMime } from '../../lib/validators'
import { errorHandler, handleRouteError, successHandler } from '../../lib/responseHandlers'

const adminOnly = [authenticate, injectTenant, authorizeRoles(['admin'])]
const secretariaOnly = [authenticate, injectTenant, authorizeRoles(['secretaria'])]
const adminOrSecretaria = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria'])]

export async function schoolsRoutes(app: FastifyInstance) {
  app.post('/schools', { preHandler: secretariaOnly }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as SecretariaPayload
      const body = createSchoolBodySchema.parse(request.body)
      const school = await createSchoolService({ ...body, secretariaId: user.secretariaId })
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: school.id }, 'CREATE', 'school', school.id)
      return successHandler(reply, 'Escola criada com sucesso.', 201, school)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da escola são inválidos.', [
        { message: 'School already exists with this slug or email', status: 409, responseMessage: 'Já existe uma escola com este endereço ou e-mail.' },
      ])
    }
  })

  app.get('/schools', { preHandler: adminOrSecretaria }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JwtPayload
    const secretariaId = user.role === 'secretaria' ? (user as SecretariaPayload).secretariaId : undefined
    try {
      const schools = await listSchoolsService(secretariaId)
      return successHandler(reply, 'Escolas carregadas com sucesso.', 200, schools)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar as escolas.')
    }
  })

  const adminOrSecretariaOrSchool = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor', 'professor'])]

  app.get('/schools/:id', { preHandler: adminOrSecretariaOrSchool }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const school = await getSchoolService(id)
      return successHandler(reply, 'Escola carregada com sucesso.', 200, school)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar a escola.', [
        { message: 'School not found', status: 404 },
      ])
    }
  })

  app.put('/schools/:id', { preHandler: adminOrSecretaria }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const user = request.user as JwtPayload
      const secretariaId = user.role === 'secretaria' ? (user as SecretariaPayload).secretariaId : undefined
      const body = updateSchoolBodySchema.parse(request.body)
      const result = await updateSchoolService(id, body, { role: user.role, secretariaId })
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: id }, 'UPDATE', 'school', id)
      return successHandler(reply, 'Escola atualizada com sucesso.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da escola são inválidos.', [
        { message: 'School not found', status: 404 },
        { message: 'Forbidden', status: 403, responseMessage: 'Sem permissão para editar esta escola.' },
        { message: 'School already exists with this slug or email', status: 409, responseMessage: 'Já existe uma escola com este endereço ou e-mail.' },
      ])
    }
  })

  app.put('/schools/:id/password', { preHandler: adminOrSecretaria }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const user = request.user as JwtPayload
      const secretariaId = user.role === 'secretaria' ? (user as SecretariaPayload).secretariaId : undefined
      const body = changePasswordBodySchema.parse(request.body)
      await changeSchoolPasswordService(id, body.password, { role: user.role, secretariaId })
      return successHandler(reply, 'Senha da escola atualizada com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'A senha informada é inválida.', [
        { message: 'School not found', status: 404 },
        { message: 'Forbidden', status: 403, responseMessage: 'Sem permissão para alterar a senha desta escola.' },
      ])
    }
  })

  app.patch('/schools/:id/financial-visibility', { preHandler: adminOnly }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const user = request.user as JwtPayload
      const result = await toggleSchoolFinancialVisibilityService(id)
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: id }, 'UPDATE', 'school', id)
      return successHandler(reply, 'Visibilidade financeira atualizada com sucesso.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível atualizar a visibilidade financeira.', [
        { message: 'School not found', status: 404 },
        { message: 'Forbidden', status: 403, responseMessage: 'Sem permissão.' },
      ])
    }
  })

  app.post('/schools/:id/logo', { preHandler: adminOrSecretariaOrSchool }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)

      const buffer = await data.toBuffer()
      const validation = validateImageFile(data.mimetype, buffer.length)
      if (!validation.valid) return errorHandler(reply, validation.message, 400)

      const result = await uploadSchoolLogoServices(id, buffer, data.mimetype, extFromMime(data.mimetype))
      return successHandler(reply, 'Logotipo da escola atualizado com sucesso.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível atualizar o logotipo da escola.', [
        { message: 'School not found', status: 404 },
      ])
    }
  })

  app.delete('/schools/:id', { preHandler: adminOrSecretaria }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const user = request.user as JwtPayload
      const secretariaId = user.role === 'secretaria' ? (user as SecretariaPayload).secretariaId : undefined
      await deleteSchoolService(id, { role: user.role, secretariaId })
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: id }, 'DELETE', 'school', id)
      return successHandler(reply, 'Escola removida com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível remover a escola.', [
        { message: 'School not found', status: 404 },
        { message: 'Forbidden', status: 403, responseMessage: 'Sem permissão para remover esta escola.' },
      ])
    }
  })

  app.delete('/schools/:id/permanent', { preHandler: adminOnly }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const user = request.user as JwtPayload
      await permanentDeleteSchoolService(id)
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: id }, 'DELETE', 'school', id, { permanent: true })
      return successHandler(reply, 'Escola removida permanentemente com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível remover permanentemente a escola.', [
        { message: 'School not found', status: 404 },
      ])
    }
  })
}
