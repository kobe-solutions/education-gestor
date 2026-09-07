import { db } from '../../db'
import { demands } from '../../db/schema/demands'
import { eq, and, count, desc } from 'drizzle-orm'

export async function findAllDemandsRepository(schoolId: string, { limit = 100, offset = 0, status }: { limit?: number; offset?: number; status?: string } = {}) {
  const conditions = [eq(demands.schoolId, schoolId)]
  if (status) conditions.push(eq(demands.status, status))

  const where = and(...conditions)

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(demands).where(where).orderBy(desc(demands.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(demands).where(where),
  ])

  return { demands: rows, total }
}

export async function findDemandByIdRepository(id: string, schoolId: string) {
  const [row] = await db.select().from(demands).where(and(eq(demands.id, id), eq(demands.schoolId, schoolId))).limit(1)
  return row
}

export async function createDemandRepository(data: typeof demands.$inferInsert) {
  const [row] = await db.insert(demands).values(data).returning()
  return row
}

export async function updateDemandRepository(id: string, schoolId: string, data: Partial<typeof demands.$inferInsert>) {
  const [row] = await db.update(demands).set({ ...data, updatedAt: new Date() }).where(and(eq(demands.id, id), eq(demands.schoolId, schoolId))).returning()
  return row
}

export async function deleteDemandRepository(id: string, schoolId: string) {
  const [row] = await db.update(demands).set({ deletedAt: new Date() }).where(and(eq(demands.id, id), eq(demands.schoolId, schoolId))).returning()
  return row
}
