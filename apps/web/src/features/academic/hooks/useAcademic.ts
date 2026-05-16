import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { Grade, Attendance } from '@education-gestor/types'

export function useStudentGrades(studentId: string) {
  return useQuery({
    queryKey: ['grades', 'student', studentId],
    queryFn: async () => {
      const res = await api.get<Grade[]>(`/students/${studentId}/grades`)
      return res.data
    },
    enabled: !!studentId,
  })
}

export function useClassGrades(classId: string) {
  return useQuery({
    queryKey: ['grades', 'class', classId],
    queryFn: async () => {
      const res = await api.get<Grade[]>(`/school-classes/${classId}/grades`)
      return res.data
    },
    enabled: !!classId,
  })
}

interface RegisterGradeInput {
  classId: string
  studentId: string
  teacherId: string
  subjectId: string
  academicPeriodId: string
  value: number
}

export function useRegisterGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: RegisterGradeInput) => {
      const res = await api.post<Grade>('/grades', data)
      return res.data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['grades', 'class', vars.classId] })
      qc.invalidateQueries({ queryKey: ['grades', 'student', vars.studentId] })
    },
  })
}

export function useStudentAttendances(studentId: string) {
  return useQuery({
    queryKey: ['attendances', 'student', studentId],
    queryFn: async () => {
      const res = await api.get<Attendance[]>(`/students/${studentId}/attendances`)
      return res.data
    },
    enabled: !!studentId,
  })
}

export function useClassAttendance(classId: string, date: string) {
  return useQuery({
    queryKey: ['attendances', 'class', classId, date],
    queryFn: async () => {
      const res = await api.get<Attendance[]>(`/school-classes/${classId}/attendances?date=${date}`)
      return res.data
    },
    enabled: !!classId && !!date,
  })
}

interface RegisterBulkAttendanceInput {
  classId: string
  date: string
  attendances: { studentId: string; present: boolean }[]
}

export function useRegisterBulkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: RegisterBulkAttendanceInput) => {
      const res = await api.post<Attendance[]>('/attendances/bulk', data)
      return res.data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['attendances', 'class', vars.classId] })
    },
  })
}
