import {
  getTeacherClassesRepository,
  getTeacherTimetableRepository,
  getTeacherAttendanceSummaryRepository,
  getTeacherClassPerformanceRepository,
  findCurrentAcademicPeriodRepository,
  getTeacherAttendanceRegisteredClassIdsRepository,
  getTeacherGradesRegisteredKeysRepository,
} from './teacherDashboard.repository'

const WEEK_DAY_MAP: Record<number, string> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

export async function getTeacherDashboardService(schoolId: string, teacherId: string) {
  const today = new Date()
  const weekDay = WEEK_DAY_MAP[today.getDay()]
  const dateTo = today.toISOString().slice(0, 10)
  const dateFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [classes, timetable, attendanceSummary, classPerformance, currentPeriod, attendanceDoneClassIds] =
    await Promise.all([
      getTeacherClassesRepository(schoolId, teacherId),
      getTeacherTimetableRepository(schoolId, teacherId),
      getTeacherAttendanceSummaryRepository(schoolId, teacherId, dateFrom, dateTo),
      getTeacherClassPerformanceRepository(schoolId, teacherId),
      findCurrentAcademicPeriodRepository(schoolId, dateTo),
      getTeacherAttendanceRegisteredClassIdsRepository(schoolId, teacherId, dateTo),
    ])

  const gradesDoneKeys = await getTeacherGradesRegisteredKeysRepository(
    schoolId,
    teacherId,
    currentPeriod?.id,
  )

  const todaySchedule = weekDay
    ? timetable
        .filter((s) => s.weekDay === weekDay)
        .map((s) => ({
          slotId: s.slotId,
          weekDay: s.weekDay,
          classPeriod: {
            id: s.classPeriodId,
            name: s.classPeriodName,
            startTime: s.startTime,
            endTime: s.endTime,
            order: s.periodOrder,
          },
          class: { id: s.classId, name: s.className },
          subject: { id: s.subjectId, name: s.subjectName },
          attendanceRegistered: attendanceDoneClassIds.has(s.classId),
          gradesLaunched: gradesDoneKeys.has(`${s.classId}:${s.subjectId}`),
        }))
    : []

  const weeklyTimetable = timetable.map((s) => ({
    slotId: s.slotId,
    weekDay: s.weekDay,
    classPeriod: {
      id: s.classPeriodId,
      name: s.classPeriodName,
      startTime: s.startTime,
      endTime: s.endTime,
      order: s.periodOrder,
    },
    class: { id: s.classId, name: s.className },
    subject: { id: s.subjectId, name: s.subjectName },
  }))

  const classIds = new Set(classes.map((c) => c.id))

  return {
    classes,
    todaySchedule,
    weeklyTimetable,
    attendanceSummary,
    classPerformance: classPerformance.filter((p) => classIds.has(p.classId)),
    pendingToday: {
      attendance: todaySchedule.filter((s) => !s.attendanceRegistered).length,
      grades: todaySchedule.filter((s) => !s.gradesLaunched).length,
    },
  }
}
