import { eq, and, lt } from 'drizzle-orm'
import { db } from '../../db'
import { tuitions } from '../../db/schema'

export async function markOverdueTuitionsJob(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]

  const updated = await db
    .update(tuitions)
    .set({ status: 'overdue', updatedAt: new Date() })
    .where(
      and(
        eq(tuitions.status, 'pending'),
        lt(tuitions.dueDate, today),
      ),
    )
    .returning({ id: tuitions.id })

  return updated.length
}
