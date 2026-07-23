import { eq, count, sum, and, gte, lte, sql, desc } from 'drizzle-orm'
import { db } from '../../db'
import { students, teachers, schoolClasses, tuitions, secretarias, schools, auditLogs } from '../../db/schema'

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
  // Secretarias
  const [secretariasTotal] = await db.select({ count: count() }).from(secretarias)
  const [secretariasActive] = await db
    .select({ count: count() })
    .from(secretarias)
    .where(eq(secretarias.active, true))

  // Schools
  const [schoolsCount] = await db.select({ count: count() }).from(schools)

  // Students — total + by enrollment status
  const [studentsTotal] = await db.select({ count: count() }).from(students)
  const studentsByStatusRows = await db
    .select({ status: students.enrollmentStatus, count: count() })
    .from(students)
    .groupBy(students.enrollmentStatus)

  // Teachers — total + by employment status
  const [teachersTotal] = await db.select({ count: count() }).from(teachers)
  const teachersByStatusRows = await db
    .select({ status: teachers.employmentStatus, count: count() })
    .from(teachers)
    .groupBy(teachers.employmentStatus)

  // Classes
  const [classesCount] = await db.select({ count: count() }).from(schoolClasses)

  // Tuitions — platform-wide financial overview
  const tuitionStats = await db
    .select({
      status: tuitions.status,
      count: count(),
      total: sum(tuitions.amount),
    })
    .from(tuitions)
    .groupBy(tuitions.status)

  const pending = tuitionStats.find((t) => t.status === 'pending')
  const paid = tuitionStats.find((t) => t.status === 'paid')
  const overdue = tuitionStats.find((t) => t.status === 'overdue')

  // Top 5 schools by student count
  const topSchoolsRows = await db
    .select({
      id: schools.id,
      name: schools.name,
      studentCount: count(students.id),
    })
    .from(schools)
    .leftJoin(students, eq(schools.id, students.schoolId))
    .groupBy(schools.id, schools.name)
    .orderBy(desc(count(students.id)))
    .limit(5)

  // Recent activity — last 10 audit log entries
  const recentActivity = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userRole: auditLogs.userRole,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(10)

  // Students by status helper
  const studentsByStatus = { active: 0, inactive: 0, transferred: 0, cancelled: 0 }
  for (const row of studentsByStatusRows) {
    if (row.status in studentsByStatus) {
      studentsByStatus[row.status as keyof typeof studentsByStatus] = row.count
    }
  }

  // Teachers by status helper
  const teachersByStatus = { ativo: 0, inativo: 0, licenca: 0 }
  for (const row of teachersByStatusRows) {
    if (row.status in teachersByStatus) {
      teachersByStatus[row.status as keyof typeof teachersByStatus] = row.count
    }
  }

  return {
    secretariasCount: secretariasTotal.count,
    secretariasActive: secretariasActive.count,
    schoolsCount: schoolsCount.count,
    studentsCount: studentsTotal.count,
    studentsByStatus,
    teachersCount: teachersTotal.count,
    teachersByStatus,
    classesCount: classesCount.count,
    tuitions: {
      pending: { count: pending?.count ?? 0, total: pending?.total ?? '0' },
      paid: { count: paid?.count ?? 0, total: paid?.total ?? '0' },
      overdue: { count: overdue?.count ?? 0, total: overdue?.total ?? '0' },
    },
    topSchools: topSchoolsRows.map((s) => ({
      id: s.id,
      name: s.name,
      studentCount: s.studentCount,
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      userId: a.userId,
      userRole: a.userRole,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      createdAt: a.createdAt.toISOString(),
    })),
  }
}

export async function getAdminActivityRepository(opts: {
  limit: number
  offset: number
  action?: string
  entity?: string
}) {
  const conditions = []
  if (opts.action) conditions.push(eq(auditLogs.action, opts.action))
  if (opts.entity) conditions.push(eq(auditLogs.entity, opts.entity))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [totalRow] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(where)

  const rows = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      userRole: auditLogs.userRole,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(opts.limit)
    .offset(opts.offset)

  return {
    total: totalRow.count,
    items: rows.map((a) => ({
      id: a.id,
      userId: a.userId,
      userRole: a.userRole,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      createdAt: a.createdAt.toISOString(),
    })),
  }
}
