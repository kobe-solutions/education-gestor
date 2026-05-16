import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { JwtPayload, SecretariaPayload } from '../../middlewares/authorize'
import {
  createSchoolService,
  listSchoolsService,
  getSchoolService,
  updateSchoolService,
  changeSchoolPasswordService,
  deleteSchoolService,
} from './schools.service'
import { createSchoolBodySchema, updateSchoolBodySchema, changePasswordBodySchema } from './schools.schema'

const secretariaOnly = [authenticate, injectTenant, authorizeRoles(['secretaria'])]
const adminOrSecretaria = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria'])]

export async function schoolsRoutes(app: FastifyInstance) {
  app.post('/schools', { preHandler: secretariaOnly }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as SecretariaPayload
      const body = createSchoolBodySchema.parse(request.body)
      const school = await createSchoolService({ ...body, secretariaId: user.secretariaId })
      return reply.status(201).send(school)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error && error.message === 'School already exists with this slug or email') {
        return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.get('/schools', { preHandler: adminOrSecretaria }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as JwtPayload
    const secretariaId = user.role === 'secretaria' ? (user as SecretariaPayload).secretariaId : undefined
    return reply.send(await listSchoolsService(secretariaId))
  })

  app.get('/schools/:id', { preHandler: adminOrSecretaria }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getSchoolService(id))
    } catch (error) {
      if (error instanceof Error && error.message === 'School not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/schools/:id', { preHandler: adminOrSecretaria }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const user = request.user as JwtPayload
      const secretariaId = user.role === 'secretaria' ? (user as SecretariaPayload).secretariaId : undefined
      const body = updateSchoolBodySchema.parse(request.body)
      return reply.send(await updateSchoolService(id, body, { role: user.role, secretariaId }))
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error) {
        if (error.message === 'School not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Forbidden') return reply.status(403).send({ message: 'Sem permissão para editar esta escola' })
        if (error.message === 'School already exists with this slug or email') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/schools/:id/password', { preHandler: adminOrSecretaria }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const user = request.user as JwtPayload
      const secretariaId = user.role === 'secretaria' ? (user as SecretariaPayload).secretariaId : undefined
      const body = changePasswordBodySchema.parse(request.body)
      await changeSchoolPasswordService(id, body.password, { role: user.role, secretariaId })
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error) {
        if (error.message === 'School not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Forbidden') return reply.status(403).send({ message: 'Sem permissão para alterar a senha desta escola' })
      }
      throw error
    }
  })

  app.delete('/schools/:id', { preHandler: adminOrSecretaria }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string }
      const user = request.user as JwtPayload
      const secretariaId = user.role === 'secretaria' ? (user as SecretariaPayload).secretariaId : undefined
      await deleteSchoolService(id, { role: user.role, secretariaId })
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'School not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Forbidden') return reply.status(403).send({ message: 'Sem permissão para remover esta escola' })
      }
      throw error
    }
  })
}
