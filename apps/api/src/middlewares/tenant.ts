import type { FastifyRequest, FastifyReply } from 'fastify'
import type { JwtPayload } from './authorize'

// Must be used after authenticate — JWT is already verified at this point.
// admin      → passes without schoolId or secretariaId
// secretaria → requires secretariaId in payload
// gestor / professor → requires schoolId in payload
export async function injectTenant(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as JwtPayload

  if (payload.role === 'admin') {
    return
  }

  if (payload.role === 'secretaria') {
    if (!payload.secretariaId) {
      return reply.status(401).send({ message: 'Tenant not identified' })
    }
    return
  }

  if (!payload.schoolId) {
    return reply.status(401).send({ message: 'Tenant not identified' })
  }
}
