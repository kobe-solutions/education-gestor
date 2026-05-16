import { db } from '../db'
import { auditLogs } from '../db/schema/auditLog'

type AuditContext = {
  userId: string
  userRole: string
  schoolId?: string
}

export async function logAudit(
  ctx: AuditContext,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PAY',
  entity: string,
  entityId: string,
  payload?: Record<string, unknown>,
) {
  await db.insert(auditLogs).values({
    schoolId: ctx.schoolId ?? null,
    userId: ctx.userId,
    userRole: ctx.userRole,
    action,
    entity,
    entityId,
    payload: payload ? JSON.stringify(payload) : null,
  }).catch(() => null) // audit nunca deve interromper o fluxo principal
}
