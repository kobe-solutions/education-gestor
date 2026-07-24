import {
  getTeacherClassesRepository,
  getTeacherTimetableRepository,
  getTeacherAttendanceSummaryRepository,
  getTeacherClassPerformanceRepository,
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

  const [classes, timetable, attendanceSummary, classPerformance] = await Promise.all([
    getTeacherClassesRepository(schoolId, teacherId),
    getTeacherTimetableRepository(schoolId, teacherId),
    getTeacherAttendanceSummaryRepository(schoolId, teacherId, dateFrom, dateTo),
    getTeacherClassPerformanceRepository(schoolId, teacherId),
  ])

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

  return {
    classes,
    todaySchedule,
    weeklyTimetable,
    attendanceSummary,
    classPerformance,
  }
}
