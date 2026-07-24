import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { JwtPayload } from '../../middlewares/authorize'
import { createSecretariaBodySchema, updateSecretariaBodySchema, addSchoolBodySchema } from './secretarias.schema'
import {
  createSecretariaService,
  updateSecretariaService,
  deleteSecretariaService,
  addSchoolToSecretariaService,
  removeSchoolFromSecretariaService,
  listSchoolsBySecretariaService,
  listSecretariasService,
  changeSecretariaPasswordService,
} from './secretarias.service'
import { changePasswordBodySchema } from '../schools/schools.schema'

export async function secretariasRoutes(app: FastifyInstance) {
  app.get(
    '/secretarias',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] },
    async (_request, reply) => {
      return reply.send(await listSecretariasService())
    },
  )

  app.post(
    '/secretarias',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] },
    async (request, reply) => {
      try {
        const body = createSecretariaBodySchema.parse(request.body)
        const secretaria = await createSecretariaService(body)
        return reply.status(201).send(secretaria)
      } catch (error) {
        if (error instanceof Error && error.message === 'Secretaria already exists with this email') {
          return reply.status(409).send({ message: error.message })
        }
        throw error
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
        return reply.send(await updateSecretariaService(id, body))
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Secretaria not found') return reply.status(404).send({ message: error.message })
          if (error.message === 'Email already in use') return reply.status(409).send({ message: error.message })
        }
        throw error
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
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof Error && error.message === 'Secretaria not found') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    },
  )

  app.delete(
    '/secretarias/:id',
    { preHandler: [authenticate, injectTenant, authorizeRoles(['admin'])] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        await deleteSecretariaService(id)
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof Error && error.message === 'Secretaria not found') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
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
          return reply.status(403).send({ message: 'Forbidden' })
        }

        return reply.send(await listSchoolsBySecretariaService(secretariaId))
      } catch (error) {
        if (error instanceof Error && error.message === 'Secretaria not found') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
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
          return reply.status(403).send({ message: 'Forbidden' })
        }

        const body = addSchoolBodySchema.parse(request.body)
        const link = await addSchoolToSecretariaService(secretariaId, body.schoolId)
        return reply.status(201).send(link)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Secretaria not found' || error.message === 'School not found') {
            return reply.status(404).send({ message: error.message })
          }
          if (error.message === 'School already linked to this secretaria') {
            return reply.status(409).send({ message: error.message })
          }
        }
        throw error
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
          return reply.status(403).send({ message: 'Forbidden' })
        }

        await removeSchoolFromSecretariaService(secretariaId, schoolId)
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof Error && error.message === 'School not linked to this secretaria') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    },
  )
}
