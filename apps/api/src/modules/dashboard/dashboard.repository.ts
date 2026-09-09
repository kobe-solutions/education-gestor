import { eq, count, sum, and, gte, lte, sql, desc, avg, inArray, ne } from 'drizzle-orm'
import { db } from '../../db'
import {
  students, teachers, schoolClasses, tuitions, secretarias, schools, auditLogs,
  grades, attendances, classStudents, studentDocuments, timetableSlots,
  classPeriods, academicYears, academicPeriods, subjects,
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

  const [tuitionTotal] = await db
    .select({
      count: count(),
      total: sum(tuitions.amount),
    })
    .from(tuitions)
    .where(eq(tuitions.schoolId, schoolId))

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
      classId: schoolClasses.id,
      className: schoolClasses.name,
      studentCount: count(classStudents.studentId),
      maxStudents: schoolClasses.maxStudents,
    })
    .from(schoolClasses)
    .leftJoin(classStudents, eq(schoolClasses.id, classStudents.classId))
    .where(eq(schoolClasses.schoolId, schoolId))
    .groupBy(schoolClasses.id, schoolClasses.name, schoolClasses.maxStudents)
    .orderBy(desc(count(classStudents.studentId)))

  // ── Per-class attendance rate (last 30 days) ──────────────────────────

  const classIds = classOccupancy.map((c) => c.classId)
  const classAttendanceRates = classIds.length > 0
    ? await db
        .select({
          classId: attendances.classId,
          total: count(),
          present: sql<number>`count(case when ${attendances.present} is true then 1 end)`,
        })
        .from(attendances)
        .where(
          and(
            inArray(attendances.classId, classIds),
            gte(attendances.date, thirtyDaysAgo),
          ),
        )
        .groupBy(attendances.classId)
    : []

  // ── Per-class average grade ───────────────────────────────────────────

  const classAverageGrades = classIds.length > 0
    ? await db
        .select({
          classId: grades.classId,
          average: avg(grades.value),
        })
        .from(grades)
        .where(inArray(grades.classId, classIds))
        .groupBy(grades.classId)
    : []

  // ── Per-class registration rate (attendance days / timetable slots) ───

  const classSlotCounts = classIds.length > 0
    ? await db
        .select({
          classId: timetableSlots.classId,
          slotCount: count(),
        })
        .from(timetableSlots)
        .where(inArray(timetableSlots.classId, classIds))
        .groupBy(timetableSlots.classId)
    : []

  const classAttendanceDays = classIds.length > 0
    ? await db
        .select({
          classId: attendances.classId,
          dayCount: sql<number>`count(distinct ${attendances.date})`,
        })
        .from(attendances)
        .where(inArray(attendances.classId, classIds))
        .groupBy(attendances.classId)
    : []

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

  // ── School-level attendance registration summary ─────────────────────

  const [totalSlotsRow] = await db
    .select({ total: count() })
    .from(timetableSlots)
    .where(eq(timetableSlots.schoolId, schoolId))

  const [registeredDaysRow] = await db
    .select({ total: sql<number>`count(distinct ${attendances.date})` })
    .from(attendances)
    .where(eq(attendances.schoolId, schoolId))

  const totalSlots = totalSlotsRow?.total ?? 0
  const registeredDays = registeredDaysRow ? Number(registeredDaysRow.total) : 0

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
      total: { count: tuitionTotal?.count ?? 0, total: tuitionTotal?.total ?? '0' },
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
    attendanceRegistration: {
      registered: registeredDays,
      total: totalSlots,
      rate: totalSlots > 0 ? Math.round((registeredDays / totalSlots) * 100) : null,
    },
    classOccupancy: classOccupancy.map((c) => {
      const attRow = classAttendanceRates.find((r) => r.classId === c.classId)
      const gradeRow = classAverageGrades.find((g) => g.classId === c.classId)
      const slotRow = classSlotCounts.find((s) => s.classId === c.classId)
      const dayRow = classAttendanceDays.find((d) => d.classId === c.classId)

      const attendanceRate = attRow && attRow.total > 0
        ? Math.round((Number(attRow.present) / attRow.total) * 100)
        : null

      const registeredDays = dayRow ? Number(dayRow.dayCount) : null

      const averageGrade = gradeRow?.average ? Number(gradeRow.average).toFixed(1) : null

      return {
        classId: c.classId,
        className: c.className,
        studentCount: c.studentCount,
        maxStudents: c.maxStudents,
        attendanceRate,
        registeredDays,
        averageGrade,
      }
    }),
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

  const [adminTuitionTotal] = await db
    .select({
      count: count(),
      total: sum(tuitions.amount),
    })
    .from(tuitions)

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
      total: { count: adminTuitionTotal?.count ?? 0, total: adminTuitionTotal?.total ?? '0' },
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

// ── Registration Status (BUG-012) ────────────────────────────────────────

function countWeekdaysBetween(startDate: string, endDate: string): Map<string, number> {
  const counts = new Map<string, number>()
  const start = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T00:00:00Z')

  for (const name of ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']) {
    counts.set(name, 0)
  }

  const current = new Date(start)
  while (current <= end) {
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][current.getUTCDay()]
    counts.set(dayName, (counts.get(dayName) ?? 0) + 1)
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return counts
}

export type RegistrationStatusTeacher = {
  teacherId: string
  teacherName: string
  classes: Array<{
    classId: string
    className: string
    subjects: Array<{
      subjectId: string
      subjectName: string
      weekDay: string
      periodName: string
      periodStartTime: string
      periodEndTime: string
      attendanceRegistered: boolean
      gradesRegistered: boolean
    }>
  }>
}

export type RegistrationStatusResult = {
  data: RegistrationStatusTeacher[]
  total: number
  summary: {
    totalSlots: number
    attendanceRegistered: number
    gradesRegistered: number
  }
}

export async function getRegistrationStatusRepository(
  schoolId: string,
  filters?: { teacherId?: string; classId?: string },
  pagination?: { limit: number; offset: number },
): Promise<RegistrationStatusResult> {
  // 1. Find active academic year
  const [activeYear] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.status, 'active')))
    .limit(1)

  if (!activeYear) {
    return { data: [], total: 0, summary: { totalSlots: 0, attendanceRegistered: 0, gradesRegistered: 0 } }
  }

  // 2. Find current academic period
  const today = new Date().toISOString().slice(0, 10)
  const [currentPeriod] = await db
    .select({ id: academicPeriods.id, startDate: academicPeriods.startDate, endDate: academicPeriods.endDate })
    .from(academicPeriods)
    .where(
      and(
        eq(academicPeriods.schoolId, schoolId),
        eq(academicPeriods.academicYearId, activeYear.id),
        sql`${academicPeriods.startDate} <= ${today}`,
        sql`${academicPeriods.endDate} >= ${today}`,
      ),
    )
    .orderBy(academicPeriods.order)
    .limit(1)

  // 3. Build slot query conditions
  const slotConditions = [
    eq(timetableSlots.schoolId, schoolId),
    eq(timetableSlots.academicYearId, activeYear.id),
  ]
  if (filters?.teacherId) slotConditions.push(eq(timetableSlots.teacherId, filters.teacherId))
  if (filters?.classId) slotConditions.push(eq(timetableSlots.classId, filters.classId))

  // 4. Fetch all relevant timetable slots with joins
  const slots = await db
    .select({
      slotId: timetableSlots.id,
      teacherId: timetableSlots.teacherId,
      teacherName: teachers.name,
      classId: timetableSlots.classId,
      className: schoolClasses.name,
      subjectId: timetableSlots.subjectId,
      subjectName: subjects.name,
      weekDay: timetableSlots.weekDay,
      classPeriodName: classPeriods.name,
      classPeriodStartTime: classPeriods.startTime,
      classPeriodEndTime: classPeriods.endTime,
    })
    .from(timetableSlots)
    .innerJoin(teachers, eq(timetableSlots.teacherId, teachers.id))
    .innerJoin(schoolClasses, eq(timetableSlots.classId, schoolClasses.id))
    .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
    .innerJoin(classPeriods, eq(timetableSlots.classPeriodId, classPeriods.id))
    .where(and(...slotConditions))
    .orderBy(teachers.name, schoolClasses.name, classPeriods.order)

  if (slots.length === 0) {
    return { data: [], total: 0, summary: { totalSlots: 0, attendanceRegistered: 0, gradesRegistered: 0 } }
  }

  const classIds = [...new Set(slots.map((s) => s.classId))]

  // 5. Count attendance dates per class within the period
  const attendanceDateCounts = new Map<string, number>()
  if (currentPeriod) {
    const attRows = await db
      .select({
        classId: attendances.classId,
        dayCount: sql<number>`count(distinct ${attendances.date})`,
      })
      .from(attendances)
      .where(
        and(
          eq(attendances.schoolId, schoolId),
          inArray(attendances.classId, classIds),
          gte(attendances.date, currentPeriod.startDate),
          lte(attendances.date, currentPeriod.endDate),
        ),
      )
      .groupBy(attendances.classId)

    for (const row of attRows) {
      attendanceDateCounts.set(row.classId, Number(row.dayCount))
    }
  }

  // 6. Compute expected weekday counts per class within the period
  const expectedWeekdayCounts = new Map<string, number>()
  if (currentPeriod) {
    const weekdayCounts = countWeekdaysBetween(currentPeriod.startDate, currentPeriod.endDate)
    for (const classId of classIds) {
      const classSlots = slots.filter((s) => s.classId === classId)
      const uniqueWeekdays = new Set(classSlots.map((s) => s.weekDay))
      let expected = 0
      for (const wd of uniqueWeekdays) {
        expected += weekdayCounts.get(wd) ?? 0
      }
      expectedWeekdayCounts.set(classId, expected)
    }
  }

  // 7. Check grades per class+subject within the current period
  const gradesRegisteredSet = new Set<string>()
  if (currentPeriod) {
    const gradeRows = await db
      .selectDistinct({ classId: grades.classId, subjectId: grades.subjectId })
      .from(grades)
      .where(
        and(
          eq(grades.schoolId, schoolId),
          inArray(grades.classId, classIds),
          eq(grades.academicPeriodId, currentPeriod.id),
        ),
      )

    for (const row of gradeRows) {
      gradesRegisteredSet.add(`${row.classId}:${row.subjectId}`)
    }
  }

  // 8. Group slots by teacher → class → subjects
  const teacherMap = new Map<string, {
    teacherId: string
    teacherName: string
    classes: Map<string, {
      classId: string
      className: string
      subjects: Array<{
        subjectId: string
        subjectName: string
        weekDay: string
        periodName: string
        periodStartTime: string
        periodEndTime: string
        attendanceRegistered: boolean
        gradesRegistered: boolean
      }>
    }>
  }>()

  let totalSlots = 0
  let attendanceRegisteredCount = 0
  let gradesRegisteredCount = 0

  for (const slot of slots) {
    totalSlots++

    let teacherEntry = teacherMap.get(slot.teacherId)
    if (!teacherEntry) {
      teacherEntry = { teacherId: slot.teacherId, teacherName: slot.teacherName, classes: new Map() }
      teacherMap.set(slot.teacherId, teacherEntry)
    }

    let classEntry = teacherEntry.classes.get(slot.classId)
    if (!classEntry) {
      classEntry = { classId: slot.classId, className: slot.className, subjects: [] }
      teacherEntry.classes.set(slot.classId, classEntry)
    }

    const expectedCount = expectedWeekdayCounts.get(slot.classId) ?? 0
    const actualCount = attendanceDateCounts.get(slot.classId) ?? 0
    const attendanceRegistered = expectedCount > 0 && actualCount >= expectedCount
    const gradesKey = `${slot.classId}:${slot.subjectId}`
    const gradesRegistered = gradesRegisteredSet.has(gradesKey)

    if (attendanceRegistered) attendanceRegisteredCount++
    if (gradesRegistered) gradesRegisteredCount++

    classEntry.subjects.push({
      subjectId: slot.subjectId,
      subjectName: slot.subjectName,
      weekDay: slot.weekDay,
      periodName: slot.classPeriodName,
      periodStartTime: slot.classPeriodStartTime,
      periodEndTime: slot.classPeriodEndTime,
      attendanceRegistered,
      gradesRegistered,
    })
  }

  const allTeachers = Array.from(teacherMap.values()).map((t) => ({
    ...t,
    classes: Array.from(t.classes.values()),
  }))

  const limit = pagination?.limit ?? 50
  const offset = pagination?.offset ?? 0
  const paginatedTeachers = allTeachers.slice(offset, offset + limit)

  return {
    data: paginatedTeachers,
    total: allTeachers.length,
    summary: { totalSlots, attendanceRegistered: attendanceRegisteredCount, gradesRegistered: gradesRegisteredCount },
  }
}
