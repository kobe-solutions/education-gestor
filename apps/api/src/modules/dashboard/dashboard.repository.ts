import { eq, count, sum, and, gte, lte, sql, desc, avg } from 'drizzle-orm'
import { db } from '../../db'
import {
  students, teachers, schoolClasses, tuitions, secretarias, schools, auditLogs,
  grades, attendances, classStudents, studentDocuments,
} from '../../db/schema'

export async function getSchoolMetricsRepository(schoolId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // ── Basic counts ──────────────────────────────────────────────────────

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

  // ── Tuitions ──────────────────────────────────────────────────────────

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

  // ── Attendance rate (last 30 days) ────────────────────────────────────

  const [attendanceRow] = await db
    .select({
      total: count(),
      present: sql<number>`count(case when ${attendances.present} is true then 1 end)`,
    })
    .from(attendances)
    .where(
      and(
        eq(attendances.schoolId, schoolId),
        gte(attendances.date, thirtyDaysAgo),
      ),
    )

  // ── Academic performance ──────────────────────────────────────────────

  const [gradeRow] = await db
    .select({
      average: avg(grades.value),
      total: count(),
      passed: sql<number>`count(case when ${grades.value}::numeric >= 6 then 1 end)`,
    })
    .from(grades)
    .where(eq(grades.schoolId, schoolId))

  // ── Students by class (occupancy) ─────────────────────────────────────

  const classOccupancy = await db
    .select({
      className: schoolClasses.name,
      studentCount: count(classStudents.studentId),
      maxStudents: schoolClasses.maxStudents,
    })
    .from(schoolClasses)
    .leftJoin(classStudents, eq(schoolClasses.id, classStudents.classId))
    .where(eq(schoolClasses.schoolId, schoolId))
    .groupBy(schoolClasses.id, schoolClasses.name, schoolClasses.maxStudents)
    .orderBy(desc(count(classStudents.studentId)))

  // ── Students by enrollment status ─────────────────────────────────────

  const studentsByStatusRows = await db
    .select({ status: students.enrollmentStatus, count: count() })
    .from(students)
    .where(eq(students.schoolId, schoolId))
    .groupBy(students.enrollmentStatus)

  // ── Teachers by employment status ─────────────────────────────────────

  const teachersByStatusRows = await db
    .select({ status: teachers.employmentStatus, count: count() })
    .from(teachers)
    .where(eq(teachers.schoolId, schoolId))
    .groupBy(teachers.employmentStatus)

  // ── Recent school activity ────────────────────────────────────────────

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
    .where(eq(auditLogs.schoolId, schoolId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(10)

  // ── Alerts ────────────────────────────────────────────────────────────

  const lowAttendanceStudents = await db
    .select({
      studentId: attendances.studentId,
      studentName: students.name,
      absenceCount: sql<number>`count(case when ${attendances.present} is false then 1 end)`,
    })
    .from(attendances)
    .innerJoin(students, eq(attendances.studentId, students.id))
    .where(
      and(
        eq(attendances.schoolId, schoolId),
        gte(attendances.date, thirtyDaysAgo),
      ),
    )
    .groupBy(attendances.studentId, students.name)
    .having(sql`count(case when ${attendances.present} is false then 1 end) >= 3`)

  const [overdueCount] = await db
    .select({ count: count() })
    .from(tuitions)
    .where(
      and(
        eq(tuitions.schoolId, schoolId),
        eq(tuitions.status, 'overdue'),
      ),
    )

  const studentsWithoutGuardians = await db
    .select({ studentId: students.id, studentName: students.name })
    .from(students)
    .where(
      and(
        eq(students.schoolId, schoolId),
        sql`${students.id} not in (select student_id from guardians)`,
      ),
    )
    .orderBy(students.name)

  const studentsWithoutIdDocument = await db
    .select({ studentId: students.id, studentName: students.name })
    .from(students)
    .where(
      and(
        eq(students.schoolId, schoolId),
        sql`${students.id} not in (select student_id from student_documents where school_id = ${sql.param(schoolId)} and type = 'identidade')`,
      ),
    )
    .orderBy(students.name)

  // ── Build response ────────────────────────────────────────────────────

  const pending = tuitionStats.find((t) => t.status === 'pending')
  const paid = tuitionStats.find((t) => t.status === 'paid')
  const overdue = tuitionStats.find((t) => t.status === 'overdue')

  const studentsByStatus: Record<string, number> = { active: 0, inactive: 0, transferred: 0, cancelled: 0 }
  for (const row of studentsByStatusRows) {
    if (row.status in studentsByStatus) {
      studentsByStatus[row.status] = row.count
    }
  }

  const teachersByStatus: Record<string, number> = { ativo: 0, inativo: 0, licenca: 0 }
  for (const row of teachersByStatusRows) {
    if (row.status in teachersByStatus) {
      teachersByStatus[row.status] = row.count
    }
  }

  const attendanceRate = attendanceRow.total > 0
    ? Math.round((attendanceRow.present / attendanceRow.total) * 100)
    : null

  const passRate = gradeRow.total > 0
    ? Math.round((gradeRow.passed / gradeRow.total) * 100)
    : null

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
    attendanceRate,
    academicPerformance: {
      average: gradeRow.average ? Number(gradeRow.average).toFixed(1) : null,
      passRate,
      totalGrades: gradeRow.total,
    },
    classOccupancy: classOccupancy.map((c) => ({
      className: c.className,
      studentCount: c.studentCount,
      maxStudents: c.maxStudents,
    })),
    studentsByStatus,
    teachersByStatus,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      userId: a.userId,
      userRole: a.userRole,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      createdAt: a.createdAt.toISOString(),
    })),
    alerts: {
      lowAttendanceStudents: lowAttendanceStudents.map((s) => ({
        studentId: s.studentId,
        studentName: s.studentName,
        absenceCount: s.absenceCount,
      })),
      overdueTuitions: overdueCount.count,
      studentsWithoutGuardians: studentsWithoutGuardians.map((s) => ({
        studentId: s.studentId,
        studentName: s.studentName,
      })),
      studentsWithoutIdDocument: studentsWithoutIdDocument.map((s) => ({
        studentId: s.studentId,
        studentName: s.studentName,
      })),
    },
  }
}

export async function getAdminMetricsRepository() {
  const [secretariasTotal] = await db.select({ count: count() }).from(secretarias)
  const [secretariasActive] = await db
    .select({ count: count() })
    .from(secretarias)
    .where(eq(secretarias.active, true))

  const [schoolsCount] = await db.select({ count: count() }).from(schools)

  const [studentsTotal] = await db.select({ count: count() }).from(students)
  const studentsByStatusRows = await db
    .select({ status: students.enrollmentStatus, count: count() })
    .from(students)
    .groupBy(students.enrollmentStatus)

  const [teachersTotal] = await db.select({ count: count() }).from(teachers)
  const teachersByStatusRows = await db
    .select({ status: teachers.employmentStatus, count: count() })
    .from(teachers)
    .groupBy(teachers.employmentStatus)

  const [classesCount] = await db.select({ count: count() }).from(schoolClasses)

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

  const studentsByStatus: Record<string, number> = { active: 0, inactive: 0, transferred: 0, cancelled: 0 }
  for (const row of studentsByStatusRows) {
    if (row.status in studentsByStatus) {
      studentsByStatus[row.status] = row.count
    }
  }

  const teachersByStatus: Record<string, number> = { ativo: 0, inativo: 0, licenca: 0 }
  for (const row of teachersByStatusRows) {
    if (row.status in teachersByStatus) {
      teachersByStatus[row.status] = row.count
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
