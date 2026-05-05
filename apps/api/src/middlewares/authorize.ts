import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify'

export type AdminPayload = {
  userId: string
  role: 'admin'
}

export type SecretariaPayload = {
  userId: string
  secretariaId: string
  role: 'secretaria'
}

export type TenantPayload = {
  userId: string
  schoolId: string
  role: 'gestor' | 'professor'
}

export type JwtPayload = AdminPayload | SecretariaPayload | TenantPayload

export function authorizeRoles(allowedRoles: JwtPayload['role'][]): preHandlerHookHandler {
  return async function authorize(request: FastifyRequest, reply: FastifyReply) {
    const payload = request.user as JwtPayload

    if (!allowedRoles.includes(payload.role)) {
      return reply.status(403).send({ message: 'Forbidden' })
    }
  }
}
