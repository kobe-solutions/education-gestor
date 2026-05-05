import type { FastifyRequest, FastifyReply } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { secretariaSchools } from '../db/schema'
import type { JwtPayload } from './authorize'

// Must be used after authenticate + injectTenant on routes that operate on a specific school.
// Validates that the caller has access to the :schoolId route param:
//   admin      → always allowed
//   secretaria → schoolId param must be linked in secretaria_schools
//   gestor / professor → schoolId param must match JWT schoolId
export async function requireSchool(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as JwtPayload
  const { schoolId } = request.params as { schoolId: string }

  if (!schoolId) {
    return reply.status(400).send({ message: 'schoolId param is required' })
  }

  if (payload.role === 'admin') {
    return
  }

  if (payload.role === 'secretaria') {
    const link = await db
      .select({ id: secretariaSchools.id })
      .from(secretariaSchools)
      .where(
        and(
          eq(secretariaSchools.secretariaId, payload.secretariaId),
          eq(secretariaSchools.schoolId, schoolId),
        ),
      )
      .limit(1)

    if (!link.length) {
      return reply.status(403).send({ message: 'Forbidden' })
    }
    return
  }

  if (payload.schoolId !== schoolId) {
    return reply.status(403).send({ message: 'Forbidden' })
  }
}
