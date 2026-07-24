import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
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

const writeHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]
const readHandler = [authenticate, injectTenant]

export async function academicYearsRoutes(app: FastifyInstance) {
  app.get('/academic-years', { preHandler: readHandler }, async (request, reply) => {
    return reply.send(await listAcademicYearsService(getSchoolId(request)))
  })

  app.get('/academic-years/active', { preHandler: readHandler }, async (request, reply) => {
    try {
      return reply.send(await getActiveAcademicYearService(getSchoolId(request)))
    } catch (error) {
      if (error instanceof Error && error.message === 'No active academic year') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.get('/academic-years/:id', { preHandler: readHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getAcademicYearService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Academic year not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/academic-years', { preHandler: writeHandler }, async (request, reply) => {
    const body = createAcademicYearBodySchema.parse(request.body)
    const year = await createAcademicYearService(getSchoolId(request), body)
    return reply.status(201).send(year)
  })

  app.put('/academic-years/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateAcademicYearBodySchema.parse(request.body)
      return reply.send(await updateAcademicYearService(getSchoolId(request), id, body))
    } catch (error) {
      if (error instanceof Error && error.message === 'Academic year not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.patch('/academic-years/:id/status', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateAcademicYearStatusBodySchema.parse(request.body)
      return reply.send(await updateAcademicYearStatusService(getSchoolId(request), id, body.status))
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Academic year not found') {
          return reply.status(404).send({ message: error.message })
        }
        if (error.message === 'Another academic year is already active') {
          return reply.status(409).send({ message: error.message })
        }
      }
      throw error
    }
  })

  app.delete('/academic-years/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteAcademicYearService(getSchoolId(request), id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Academic year not found') {
          return reply.status(404).send({ message: error.message })
        }
        if (error.message === 'Cannot delete an active academic year') {
          return reply.status(409).send({ message: error.message })
        }
      }
      throw error
    }
  })
}
