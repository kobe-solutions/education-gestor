import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type ApiSuccessResponse } from '../../../lib/api'
import { extractErrorMessage } from '../../../lib/errors'
import type {
  Grade,
  Attendance,
  StudentReport,
  Assessment,
  PeriodGradeConfig,
  GradeCalculationMethod,
} from '@education-gestor/types'

export function useStudentGrades(studentId: string) {
  return useQuery({
    queryKey: ['grades', 'student', studentId],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<Grade[]>>(`/students/${studentId}/grades`)
      return res.data.data
    },
    enabled: !!studentId,
  })
}

export function useStudentReport(studentId: string) {
  return useQuery({
    queryKey: ['grades', 'student', studentId, 'report'],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<StudentReport>>(`/students/${studentId}/report`)
      return res.data.data
    },
    enabled: !!studentId,
  })
}

export function useClassGrades(classId: string) {
  return useQuery({
    queryKey: ['grades', 'class', classId],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<Grade[]>>(`/school-classes/${classId}/grades`)
      return res.data.data
    },
    enabled: !!classId,
  })
}

export function useClassAssessments(classId: string, subjectId?: string) {
  return useQuery({
    queryKey: ['assessments', 'class', classId, subjectId ?? 'all'],
    queryFn: async () => {
      const params = subjectId ? `?subjectId=${subjectId}` : ''
      const res = await api.get<Assessment[]>(`/school-classes/${classId}/assessments${params}`)
      return res.data
    },
    enabled: !!classId,
  })
}

export function useCreateAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      classId: string
      subjectId: string
      academicPeriodId: string
      teacherId: string
      name: string
      weight?: number
    }) => {
      const res = await api.post<Assessment>('/assessments', data)
      return res.data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['assessments', 'class', vars.classId] })
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao criar avaliação'))
    },
  })
}

export function useUpdateAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      classId: _classId,
      ...data
    }: {
      id: string
      classId: string
      name?: string
      weight?: number
      order?: number
    }) => {
      const res = await api.patch<Assessment>(`/assessments/${id}`, data)
      return res.data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['assessments', 'class', vars.classId] })
      qc.invalidateQueries({ queryKey: ['grades', 'class', vars.classId] })
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao atualizar avaliação'))
    },
  })
}

export function useDeleteAssessment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; classId: string }) => {
      await api.delete(`/assessments/${id}`)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['assessments', 'class', vars.classId] })
      qc.invalidateQueries({ queryKey: ['grades', 'class', vars.classId] })
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao excluir avaliação'))
    },
  })
}

export function useClassGradeConfigs(classId: string, subjectId?: string) {
  return useQuery({
    queryKey: ['grade-configs', 'class', classId, subjectId ?? 'all'],
    queryFn: async () => {
      const params = subjectId ? `?subjectId=${subjectId}` : ''
      const res = await api.get<PeriodGradeConfig[]>(`/school-classes/${classId}/grade-configs${params}`)
      return res.data
    },
    enabled: !!classId,
  })
}

export function useUpsertPeriodGradeConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      classId: string
      subjectId: string
      academicPeriodId: string
      calculationMethod: GradeCalculationMethod
    }) => {
      const res = await api.put<PeriodGradeConfig>('/period-grade-configs', data)
      return res.data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['grade-configs', 'class', vars.classId] })
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao atualizar cálculo da média'))
    },
  })
}

interface RegisterGradeInput {
  classId: string
  studentId: string
  teacherId: string
  subjectId: string
  academicPeriodId: string
  assessmentId?: string | null
  value: number
}

export function useRegisterGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: RegisterGradeInput) => {
      const res = await api.post<ApiSuccessResponse<Grade>>('/grades', data)
      return res.data
    },
    onSuccess: (response, vars) => {
      toast.success(response.message)
      qc.invalidateQueries({ queryKey: ['grades', 'class', vars.classId] })
      qc.invalidateQueries({ queryKey: ['grades', 'student', vars.studentId] })
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao lançar nota'))
    },
  })
}

export interface RegisterBulkGradeInput {
  classId: string
  subjectId: string
  teacherId: string
  grades: {
    studentId: string
    academicPeriodId: string
    assessmentId?: string | null
    value: number
  }[]
  deleteGradeIds?: string[]
}

export function useRegisterBulkGrades() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: RegisterBulkGradeInput) => {
      const res = await api.post<ApiSuccessResponse<Grade[]>>('/grades/bulk', data)
      return res.data
    },
    onSuccess: (response, vars) => {
      toast.success(response.message)
      qc.invalidateQueries({ queryKey: ['grades', 'class', vars.classId] })
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao salvar notas'))
    },
  })
}

export function useStudentAttendances(studentId: string) {
  return useQuery({
    queryKey: ['attendances', 'student', studentId],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<Attendance[]>>(`/students/${studentId}/attendances`)
      return res.data.data
    },
    enabled: !!studentId,
  })
}

export function useClassAttendance(classId: string, date: string) {
  return useQuery({
    queryKey: ['attendances', 'class', classId, date],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<Attendance[]>>(`/school-classes/${classId}/attendances?date=${date}`)
      return res.data.data
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
      const res = await api.post<ApiSuccessResponse<Attendance[]>>('/attendances/bulk', data)
      return res.data
    },
    onSuccess: (response, vars) => {
      toast.success(response.message)
      qc.invalidateQueries({ queryKey: ['attendances', 'class', vars.classId] })
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao registrar frequência'))
    },
  })
}
