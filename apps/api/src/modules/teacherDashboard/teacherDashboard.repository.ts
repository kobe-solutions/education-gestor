import { eq, and, inArray, sql, count, avg, desc } from 'drizzle-orm'
import { db } from '../../db'
import {
  timetableSlots,
  schoolClasses,
  classStudents,
  subjects,
  classPeriods,
  attendances,
  grades,
} from '../../db/schema'

export async function getTeacherClassesRepository(schoolId: string, teacherId: string) {
  const slots = await db
    .selectDistinct({
      classId: timetableSlots.classId,
    })
    .from(timetableSlots)
    .where(
      and(eq(timetableSlots.schoolId, schoolId), eq(timetableSlots.teacherId, teacherId)),
    )

  if (slots.length === 0) return []

  const classIds = slots.map((s) => s.classId)

  const classes = await db
    .select({
      id: schoolClasses.id,
      name: schoolClasses.name,
      shift: schoolClasses.shift,
    })
    .from(schoolClasses)
    .where(inArray(schoolClasses.id, classIds))

  const studentCounts = await db
    .select({
      classId: classStudents.classId,
      count: count(),
    })
    .from(classStudents)
    .where(inArray(classStudents.classId, classIds))
    .groupBy(classStudents.classId)

  const teacherSubjects = await db
    .selectDistinct({
      classId: timetableSlots.classId,
      subjectId: subjects.id,
      subjectName: subjects.name,
    })
    .from(timetableSlots)
    .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
    .where(
      and(eq(timetableSlots.schoolId, schoolId), eq(timetableSlots.teacherId, teacherId)),
    )

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    shift: c.shift,
    studentCount: studentCounts.find((sc) => sc.classId === c.id)?.count ?? 0,
    subjects: teacherSubjects
      .filter((ts) => ts.classId === c.id)
      .map((ts) => ({ id: ts.subjectId, name: ts.subjectName })),
  }))
}

export async function getTeacherTimetableRepository(schoolId: string, teacherId: string) {
  return db
    .select({
      slotId: timetableSlots.id,
      weekDay: timetableSlots.weekDay,
      classPeriodId: classPeriods.id,
      classPeriodName: classPeriods.name,
      startTime: classPeriods.startTime,
      endTime: classPeriods.endTime,
      periodOrder: classPeriods.order,
      classId: schoolClasses.id,
      className: schoolClasses.name,
      subjectId: subjects.id,
      subjectName: subjects.name,
    })
    .from(timetableSlots)
    .innerJoin(classPeriods, eq(timetableSlots.classPeriodId, classPeriods.id))
    .innerJoin(schoolClasses, eq(timetableSlots.classId, schoolClasses.id))
    .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
    .where(
      and(eq(timetableSlots.schoolId, schoolId), eq(timetableSlots.teacherId, teacherId)),
    )
    .orderBy(timetableSlots.weekDay, classPeriods.order)
}

export async function getTeacherAttendanceSummaryRepository(
  schoolId: string,
  teacherId: string,
  dateFrom: string,
  dateTo: string,
) {
  const teacherClasses = await db
    .selectDistinct({ classId: timetableSlots.classId })
    .from(timetableSlots)
    .where(
      and(eq(timetableSlots.schoolId, schoolId), eq(timetableSlots.teacherId, teacherId)),
    )

  if (teacherClasses.length === 0) return []

  const classIds = teacherClasses.map((c) => c.classId)

  const classInfo = await db
    .select({ id: schoolClasses.id, name: schoolClasses.name })
    .from(schoolClasses)
    .where(inArray(schoolClasses.id, classIds))

  const attendanceRows = await db
    .select({
      classId: attendances.classId,
      date: attendances.date,
      total: count(),
      absent: sql<number>`count(*) filter (where ${attendances.present} = false)`.as('absent'),
    })
    .from(attendances)
    .where(
      and(
        inArray(attendances.classId, classIds),
        sql`${attendances.date} >= ${dateFrom}`,
        sql`${attendances.date} <= ${dateTo}`,
      ),
    )
    .groupBy(attendances.classId, attendances.date)

  return classIds.map((classId) => {
    const rows = attendanceRows.filter((r) => r.classId === classId)
    const totalRecords = rows.reduce((sum, r) => sum + r.total, 0)
    const absentCount = rows.reduce((sum, r) => sum + Number(r.absent), 0)
    const attendanceRate =
      totalRecords > 0 ? Math.round(((totalRecords - absentCount) / totalRecords) * 100) : 100

    return {
      classId,
      className: classInfo.find((c) => c.id === classId)?.name ?? '',
      totalRecords,
      absentCount,
      attendanceRate,
      recentDates: rows.map((r) => ({
        date: r.date,
        totalStudents: r.total,
        absentCount: Number(r.absent),
      })),
    }
  })
}

export async function getTeacherClassPerformanceRepository(
  schoolId: string,
  teacherId: string,
) {
  const rows = await db
    .select({
      classId: grades.classId,
      className: schoolClasses.name,
      subjectId: grades.subjectId,
      subjectName: subjects.name,
      averageGrade: avg(grades.value),
      studentCount: sql<number>`count(distinct ${grades.studentId})`,
    })
    .from(grades)
    .innerJoin(schoolClasses, eq(grades.classId, schoolClasses.id))
    .innerJoin(subjects, eq(grades.subjectId, subjects.id))
    .where(and(eq(grades.schoolId, schoolId), eq(grades.teacherId, teacherId)))
    .groupBy(grades.classId, schoolClasses.name, grades.subjectId, subjects.name)

  const grouped = new Map<
    string,
    { classId: string; className: string; subjects: Array<{ subjectId: string; subjectName: string; averageGrade: number; studentCount: number }> }
  >()

  for (const row of rows) {
    let entry = grouped.get(row.classId)
    if (!entry) {
      entry = { classId: row.classId, className: row.className, subjects: [] }
      grouped.set(row.classId, entry)
    }
    entry.subjects.push({
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      averageGrade: Number(row.averageGrade),
      studentCount: Number(row.studentCount),
    })
  }

  return Array.from(grouped.values())
}
