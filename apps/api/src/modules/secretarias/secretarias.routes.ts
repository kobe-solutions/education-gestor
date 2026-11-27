import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles, type JwtPayload } from '../../middlewares/authorize'
import { logAudit } from '../../lib/audit'
import { createSecretariaBodySchema, updateSecretariaBodySchema, addSchoolBodySchema } from './secretarias.schema'
import { validateImageFile, extFromMime } from '../../lib/validators'
import {
  createSecretariaService,
  updateSecretariaService,
  deleteSecretariaService,
  addSchoolToSecretariaService,
  removeSchoolFromSecretariaService,
  listSchoolsBySecretariaService,
  listSecretariasService,
  changeSecretariaPasswordService,
  toggleSecretariaFinancialVisibilityService,
  uploadSecretariaLogoService,
} from './secretarias.service'
import { changePasswordBodySchema } from '../schools/schools.schema'
import { errorHandler, handleRouteError, successHandler } from '../../lib/responseHandlers'

export async function secretariasRoutes(app: FastifyInstance) {
  app.get(
    '/secretarias',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] },
    async (_request, reply) => {
      try {
        const secretarias = await listSecretariasService()
        return successHandler(reply, 'Secretarias carregadas com sucesso.', 200, secretarias)
      } catch (error) {
        return handleRouteError(reply, error, 'Não foi possível carregar as secretarias.')
      }
    },
  )

  app.post(
    '/secretarias',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] },
    async (request, reply) => {
      try {
        const body = createSecretariaBodySchema.parse(request.body)
        const secretaria = await createSecretariaService(body)
        const user = request.user as JwtPayload
        await logAudit({ userId: user.userId, userRole: user.role }, 'CREATE', 'secretaria', secretaria.id)
        return successHandler(reply, 'Secretaria criada com sucesso.', 201, secretaria)
      } catch (error) {
        return handleRouteError(reply, error, 'Os dados da secretaria são inválidos.', [
          { message: 'Secretaria already exists with this email', status: 409, responseMessage: 'Já existe uma secretaria com este e-mail.' },
        ])
      }
    },
  )

  app.put(
    '/secretarias/:id',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = updateSecretariaBodySchema.parse(request.body)
        const result = await updateSecretariaService(id, body)
        const user = request.user as JwtPayload
        await logAudit({ userId: user.userId, userRole: user.role }, 'UPDATE', 'secretaria', id)
        return successHandler(reply, 'Secretaria atualizada com sucesso.', 200, result)
      } catch (error) {
        return handleRouteError(reply, error, 'Os dados da secretaria são inválidos.', [
          { message: 'Secretaria not found', status: 404 },
          { message: 'Email already in use', status: 409, responseMessage: 'Este e-mail já está em uso.' },
        ])
      }
    },
  )

  app.put(
    '/secretarias/:id/password',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = changePasswordBodySchema.parse(request.body)
        await changeSecretariaPasswordService(id, body.password)
        return successHandler(reply, 'Senha da secretaria atualizada com sucesso.', 200, null)
      } catch (error) {
        return handleRouteError(reply, error, 'A senha informada é inválida.', [
          { message: 'Secretaria not found', status: 404 },
        ])
      }
    },
  )

  app.patch(
    '/secretarias/:id/financial-visibility',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const result = await toggleSecretariaFinancialVisibilityService(id)
        const user = request.user as JwtPayload
        await logAudit({ userId: user.userId, userRole: user.role }, 'UPDATE', 'secretaria', id)
        return successHandler(reply, 'Visibilidade financeira atualizada com sucesso.', 200, result)
      } catch (error) {
        return handleRouteError(reply, error, 'Não foi possível atualizar a visibilidade financeira.', [
          { message: 'Secretaria not found', status: 404 },
        ])
      }
    },
  )

  app.post('/secretarias/:id/logo', { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)

      const buffer = await data.toBuffer()
      const validation = validateImageFile(data.mimetype, buffer.length)
      if (!validation.valid) return errorHandler(reply, validation.message, 400)

      const result = await uploadSecretariaLogoService(id, buffer, data.mimetype, extFromMime(data.mimetype))
      return successHandler(reply, 'Logotipo da secretaria atualizado com sucesso.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível atualizar o logotipo da secretaria.', [
        { message: 'Secretaria not found', status: 404 },
      ])
    }
  })

  app.delete(
    '/secretarias/:id',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        await deleteSecretariaService(id)
        const user = request.user as JwtPayload
        await logAudit({ userId: user.userId, userRole: user.role }, 'DELETE', 'secretaria', id)
        return successHandler(reply, 'Secretaria excluída com sucesso.', 200, null)
      } catch (error) {
        return handleRouteError(reply, error, 'Não foi possível excluir a secretaria.', [
          { message: 'Secretaria not found', status: 404 },
        ])
      }
    },
  )

  app.get(
    '/secretarias/:secretariaId/schools',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria'])] },
    async (request, reply) => {
      try {
        const payload = request.user as JwtPayload
        const { secretariaId } = request.params as { secretariaId: string }

        if (payload.role === 'secretaria' && payload.secretariaId !== secretariaId) {
          return errorHandler(reply, 'Sem permissão para consultar as escolas desta secretaria.', 403)
        }

        const schools = await listSchoolsBySecretariaService(secretariaId)
        return successHandler(reply, 'Escolas da secretaria carregadas com sucesso.', 200, schools)
      } catch (error) {
        return handleRouteError(reply, error, 'Não foi possível carregar as escolas da secretaria.', [
          { message: 'Secretaria not found', status: 404 },
        ])
      }
    },
  )

  app.post(
    '/secretarias/:secretariaId/schools',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria'])] },
    async (request, reply) => {
      try {
        const payload = request.user as JwtPayload
        const { secretariaId } = request.params as { secretariaId: string }

        if (payload.role === 'secretaria' && payload.secretariaId !== secretariaId) {
          return errorHandler(reply, 'Sem permissão para vincular escolas a esta secretaria.', 403)
        }

        const body = addSchoolBodySchema.parse(request.body)
        const link = await addSchoolToSecretariaService(secretariaId, body.schoolId)
        return successHandler(reply, 'Escola vinculada à secretaria com sucesso.', 201, link)
      } catch (error) {
        return handleRouteError(reply, error, 'Os dados do vínculo são inválidos.', [
          { message: 'Secretaria not found', status: 404 },
          { message: 'School not found', status: 404, responseMessage: 'A escola informada não foi encontrada.' },
          { message: 'School already linked to this secretaria', status: 409, responseMessage: 'Esta escola já está vinculada à secretaria.' },
        ])
      }
    },
  )

  app.delete(
    '/secretarias/:secretariaId/schools/:schoolId',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria'])] },
    async (request, reply) => {
      try {
        const payload = request.user as JwtPayload
        const { secretariaId, schoolId } = request.params as { secretariaId: string; schoolId: string }

        if (payload.role === 'secretaria' && payload.secretariaId !== secretariaId) {
          return errorHandler(reply, 'Sem permissão para remover escolas desta secretaria.', 403)
        }

        await removeSchoolFromSecretariaService(secretariaId, schoolId)
        return successHandler(reply, 'Vínculo da escola removido com sucesso.', 200, null)
      } catch (error) {
        return handleRouteError(reply, error, 'Não foi possível remover o vínculo da escola.', [
          { message: 'School not linked to this secretaria', status: 404, responseMessage: 'A escola não está vinculada a esta secretaria.' },
        ])
      }
    },
  )
}
