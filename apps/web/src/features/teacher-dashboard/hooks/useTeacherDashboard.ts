import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'

export interface TeacherClass {
  id: string
  name: string
  shift: string
  studentCount: number
  subjects: { id: string; name: string }[]
}

export interface TimetableSlotInfo {
  slotId: string
  weekDay: string
  classPeriod: {
    id: string
    name: string
    startTime: string
    endTime: string
    order: number
  }
  class: { id: string; name: string }
  subject: { id: string; name: string }
}

export interface AttendanceDateEntry {
  date: string
  totalStudents: number
  absentCount: number
}

export interface AttendanceSummaryEntry {
  classId: string
  className: string
  totalRecords: number
  absentCount: number
  attendanceRate: number
  recentDates: AttendanceDateEntry[]
}

export interface ClassSubjectPerformance {
  subjectId: string
  subjectName: string
  averageGrade: number
  studentCount: number
}

export interface ClassPerformanceEntry {
  classId: string
  className: string
  subjects: ClassSubjectPerformance[]
}

export interface TeacherDashboardData {
  classes: TeacherClass[]
  todaySchedule: TimetableSlotInfo[]
  weeklyTimetable: TimetableSlotInfo[]
  attendanceSummary: AttendanceSummaryEntry[]
  classPerformance: ClassPerformanceEntry[]
}

export function useTeacherDashboard() {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['teacher-dashboard', schoolKey],
    queryFn: async () => {
      const res = await api.get<TeacherDashboardData>('/teacher/dashboard')
      return res.data
    },
    enabled,
    staleTime: 60_000,
  })
}
