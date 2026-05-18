import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { SchoolClass, AcademicPeriod } from '@education-gestor/types'

export function useClasses() {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['classes', schoolKey],
    queryFn: async () => {
      const res = await api.get<SchoolClass[]>('/school-classes')
      return res.data
    },
    enabled,
  })
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: async () => {
      const res = await api.get<SchoolClass>(`/school-classes/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

interface ClassInput {
  name: string
  shift: string
  serieId?: string | null
  academicPeriodId?: string | null
}

export function useCreateClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ClassInput) => {
      const res = await api.post<SchoolClass>('/school-classes', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

export function useUpdateClass(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<ClassInput>) => {
      const res = await api.put<SchoolClass>(`/school-classes/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      qc.invalidateQueries({ queryKey: ['classes', id] })
    },
  })
}

export function useDeleteClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/school-classes/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  })
}

export function useAddStudentToClass(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (studentId: string) => {
      await api.post(`/school-classes/${classId}/students`, { id: studentId })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes', classId] }),
  })
}

export function useRemoveStudentFromClass(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (studentId: string) => {
      await api.delete(`/school-classes/${classId}/students/${studentId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes', classId] }),
  })
}

export function useAddTeacherToClass(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (teacherId: string) => {
      await api.post(`/school-classes/${classId}/teachers`, { id: teacherId })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes', classId] }),
  })
}

export function useAcademicPeriods() {
  return useQuery({
    queryKey: ['academic-periods'],
    queryFn: async () => {
      const res = await api.get<AcademicPeriod[]>('/academic-periods')
      return res.data
    },
  })
}

export function useCreateAcademicPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; startDate: string; endDate: string }) => {
      const res = await api.post<AcademicPeriod>('/academic-periods', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-periods'] }),
  })
}

interface UpdateAcademicPeriodInput {
  name?: string
  startDate?: string
  endDate?: string
  active?: boolean
}

export function useUpdateAcademicPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAcademicPeriodInput }) => {
      const res = await api.put<AcademicPeriod>(`/academic-periods/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-periods'] }),
  })
}

export function useStudentClasses(studentId: string) {
  return useQuery({
    queryKey: ['student-classes', studentId],
    queryFn: async () => {
      const res = await api.get<{ id: string; name: string; shift: string; serieId: string | null }[]>(
        `/school-classes/students/${studentId}`,
      )
      return res.data
    },
    enabled: !!studentId,
  })
}

export function useDeleteAcademicPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/academic-periods/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-periods'] }),
  })
}
