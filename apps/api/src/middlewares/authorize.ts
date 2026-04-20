import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'

type JwtPayload = {
  userId: string
  schoolId: string
  role: string
}

function normalizeRole(role: string) {
  if (role === 'gestao') {
    return 'gestor'
  }

  return role
}

export function authorizeRoles(allowedRoles: string[]): preHandlerHookHandler {
  return async function authorize(request: FastifyRequest, reply: FastifyReply) {
    const payload = request.user as JwtPayload
    const userRole = normalizeRole(payload.role)
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole)

    if (!normalizedAllowedRoles.includes(userRole)) {
      return reply.status(403).send({ message: 'Forbidden' })
    }
  }
}
