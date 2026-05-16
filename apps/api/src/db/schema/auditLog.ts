import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id'),
  userId: text('user_id').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  payload: text('payload'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
