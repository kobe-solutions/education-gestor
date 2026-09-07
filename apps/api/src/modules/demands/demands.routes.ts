import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { createDemandBodySchema, updateDemandBodySchema } from './demands.schema'
import {
  listDemandsService,
  getDemandService,
  createDemandService,
  updateDemandService,
  deleteDemandService,
} from './demands.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function demandsRoutes(app: FastifyInstance) {
  app.get('/demands', { preHandler }, async (request, reply) => {
    const { status } = request.query as { status?: string }
    return reply.send(await listDemandsService(getSchoolId(request), { status }))
  })

  app.get('/demands/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      return reply.send(await getDemandService(id, getSchoolId(request)))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro interno'
      if (msg.includes('não encontrada')) return reply.status(404).send({ error: msg })
      return reply.status(500).send({ error: msg })
    }
  })

  app.post('/demands', { preHandler }, async (request, reply) => {
    const parsed = createDemandBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    const demand = await createDemandService(parsed.data, getSchoolId(request))
    return reply.status(201).send(demand)
  })

  app.patch('/demands/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateDemandBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })
    try {
      return reply.send(await updateDemandService(id, parsed.data, getSchoolId(request)))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro interno'
      if (msg.includes('não encontrada')) return reply.status(404).send({ error: msg })
      return reply.status(500).send({ error: msg })
    }
  })

  app.delete('/demands/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await deleteDemandService(id, getSchoolId(request))
      return reply.status(204).send()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro interno'
      if (msg.includes('não encontrada')) return reply.status(404).send({ error: msg })
      return reply.status(500).send({ error: msg })
    }
  })
}
