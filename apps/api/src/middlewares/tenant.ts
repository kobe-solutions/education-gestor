import type { FastifyRequest, FastifyReply } from 'fastify'

// Must be used after authenticate — JWT is already verified at this point
export async function injectTenant(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; schoolId: string; role: string }

  if (!payload.schoolId) {
    return reply.status(401).send({ message: 'Tenant not identified' })
  }
}
