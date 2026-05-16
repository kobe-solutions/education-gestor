import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { getSchoolId } from '../../lib/routeHelpers'
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
    return reply.send(await listEducationLevelsService(getSchoolId(request)))
  })

  app.get('/education-levels/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getEducationLevelService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Education level not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/education-levels', { preHandler }, async (request, reply) => {
    try {
      const body = createEducationLevelBodySchema.parse(request.body)
      const level = await createEducationLevelService({ schoolId: getSchoolId(request), ...body })
      return reply.status(201).send(level)
    } catch (error) {
      if (error instanceof Error && error.message === 'Education level already exists with this name') {
        return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/education-levels/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateEducationLevelBodySchema.parse(request.body)
      return reply.send(await updateEducationLevelService(getSchoolId(request), id, body))
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Education level not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Education level already exists with this name') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/education-levels/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteEducationLevelService(getSchoolId(request), id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Education level not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}
