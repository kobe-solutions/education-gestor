import { eq, count, sum, and, gte, lte, sql } from 'drizzle-orm'
import { db } from '../../db'
import { students, teachers, schoolClasses, tuitions, secretarias, schools } from '../../db/schema'

export async function getSchoolMetricsRepository(schoolId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [studentsCount] = await db
    .select({ count: count() })
    .from(students)
    .where(eq(students.schoolId, schoolId))

  const [teachersCount] = await db
    .select({ count: count() })
    .from(teachers)
    .where(eq(teachers.schoolId, schoolId))

  const [classesCount] = await db
    .select({ count: count() })
    .from(schoolClasses)
    .where(eq(schoolClasses.schoolId, schoolId))

  const tuitionStats = await db
    .select({
      status: tuitions.status,
      count: count(),
      total: sum(tuitions.amount),
    })
    .from(tuitions)
    .where(eq(tuitions.schoolId, schoolId))
    .groupBy(tuitions.status)

  const upcoming = await db
    .select({
      id: tuitions.id,
      studentId: tuitions.studentId,
      studentName: students.name,
      amount: tuitions.amount,
      dueDate: tuitions.dueDate,
      status: tuitions.status,
    })
    .from(tuitions)
    .innerJoin(students, eq(tuitions.studentId, students.id))
    .where(
      and(
        eq(tuitions.schoolId, schoolId),
        sql`${tuitions.status} != 'paid'`,
        gte(tuitions.dueDate, today),
        lte(tuitions.dueDate, in7Days),
      ),
    )
    .orderBy(tuitions.dueDate)
    .limit(10)

  const pending = tuitionStats.find((t) => t.status === 'pending')
  const paid = tuitionStats.find((t) => t.status === 'paid')
  const overdue = tuitionStats.find((t) => t.status === 'overdue')

  return {
    studentsCount: studentsCount.count,
    teachersCount: teachersCount.count,
    classesCount: classesCount.count,
    tuitions: {
      pending: { count: pending?.count ?? 0, total: pending?.total ?? '0' },
      paid: { count: paid?.count ?? 0, total: paid?.total ?? '0' },
      overdue: { count: overdue?.count ?? 0, total: overdue?.total ?? '0' },
    },
    upcomingTuitions: upcoming,
  }
}

export async function getAdminMetricsRepository() {
  const [secretariasCount] = await db.select({ count: count() }).from(secretarias)
  const [schoolsCount] = await db.select({ count: count() }).from(schools)

  return {
    secretariasCount: secretariasCount.count,
    schoolsCount: schoolsCount.count,
  }
}
