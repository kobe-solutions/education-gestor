import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { authorizeRoles } from '../../middlewares/authorize'
import { injectTenant } from '../../middlewares/tenant'
import { getSchoolId } from '../../lib/routeHelpers'
import { createSubjectBodySchema, updateSubjectBodySchema } from './subjects.schema'
import {
  createSubjectService,
  listSubjectsService,
  getSubjectService,
  updateSubjectService,
  deleteSubjectService,
} from './subjects.service'

const readPreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor', 'professor'])]
const writePreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'gestor'])]

export async function subjectsRoutes(app: FastifyInstance) {
  app.get('/subjects', { preHandler: readPreHandler }, async (request, reply) => {
    return reply.send(await listSubjectsService(getSchoolId(request)))
  })

  app.get('/subjects/:id', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getSubjectService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Subject not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/subjects', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const body = createSubjectBodySchema.parse(request.body)
      const subject = await createSubjectService({ schoolId: getSchoolId(request), ...body })
      return reply.status(201).send(subject)
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Subject already exists with this name' ||
          error.message === 'Subject already exists with this code'
        ) {
          return reply.status(409).send({ message: error.message })
        }
      }
      throw error
    }
  })

  app.put('/subjects/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateSubjectBodySchema.parse(request.body)
      return reply.send(await updateSubjectService(getSchoolId(request), id, body))
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Subject not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Subject already exists with this name') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/subjects/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteSubjectService(getSchoolId(request), id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Subject not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}
