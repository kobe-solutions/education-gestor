import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type ApiSuccessResponse } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { Teacher, TeacherDocument } from '@education-gestor/types'

export type TeacherCreateInput = Pick<Teacher,
  'name' | 'email' |
  'cpf' | 'rg' | 'birthDate' | 'sex' | 'nationality' | 'maritalStatus' | 'phone' |
  'addressCep' | 'addressStreet' | 'addressNumber' | 'addressComplement' |
  'addressNeighborhood' | 'addressCity' | 'addressState' |
  'position' | 'contractType' | 'workload' | 'workShift' |
  'educationLevel' | 'degree' | 'institution' | 'professionalRegistry' |
  'bank' | 'agency' | 'accountNumber' | 'accountType' | 'pixKey'
> & { password: string }

export type TeacherUpdateInput = Partial<Omit<TeacherCreateInput, 'password'>> & {
  employmentStatus?: Teacher['employmentStatus']
}

export function useTeachers(params?: { page?: number; limit?: number }) {
  const { schoolKey, enabled } = useSchoolKey()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  return useQuery({
    queryKey: ['teachers', schoolKey, { page, limit }],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<{ data: Teacher[]; total: number }>>('/teachers', {
        params: { page, limit },
      })
      return { data: res.data.data.data, total: res.data.data.total }
    },
    enabled,
  })
}

export function useAllTeachers() {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['teachers', schoolKey],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<{ data: Teacher[]; total: number }>>('/teachers')
      return res.data.data.data
    },
    enabled,
  })
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: async () => (await api.get<ApiSuccessResponse<Teacher>>(`/teachers/${id}`)).data.data,
    enabled: !!id,
  })
}

export function useCreateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<TeacherCreateInput> & { name: string; email: string; password: string }) =>
      (await api.post<ApiSuccessResponse<Teacher>>('/teachers', data)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

export function useUpdateTeacher(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: TeacherUpdateInput) =>
      (await api.put<ApiSuccessResponse<Teacher>>(`/teachers/${id}`, data)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      qc.invalidateQueries({ queryKey: ['teachers', id] })
    },
  })
}

export function useDeleteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/teachers/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

export function usePermanentDeleteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/teachers/${id}/permanent`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

export function useAddTeacherSubject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (subjectId: string) => {
      await api.post(`/teachers/${id}/subjects`, { subjectId })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers', id] })
      qc.invalidateQueries({ queryKey: ['teachers'] })
    },
  })
}

export function useRemoveTeacherSubject(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (subjectId: string) => {
      await api.delete(`/teachers/${id}/subjects/${subjectId}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers', id] })
      qc.invalidateQueries({ queryKey: ['teachers'] })
    },
  })
}

export function useChangeTeacherPassword(id: string) {
  return useMutation({
    mutationFn: async (password: string) => {
      await api.put(`/teachers/${id}/password`, { password })
    },
  })
}

// ─── Self-service (professor) ───────────────────────────────────────────────

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: TeacherUpdateInput) =>
      (await api.put<ApiSuccessResponse<Teacher>>('/teachers/me', data)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
    },
  })
}

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      await api.put('/teachers/me/password', { password })
    },
  })
}

export function useUploadTeacherPhoto(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<ApiSuccessResponse<Teacher>>(`/teachers/${id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers', id] })
      qc.invalidateQueries({ queryKey: ['teachers'] })
    },
  })
}

export function useTeacherDocuments(teacherId: string) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'documents'],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<TeacherDocument[]>>(`/teachers/${teacherId}/documents`)
      return res.data.data
    },
    enabled: !!teacherId,
  })
}

export function useUploadTeacherDocument(teacherId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<ApiSuccessResponse<TeacherDocument>>(
        `/teachers/${teacherId}/documents?type=${type}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )).data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers', teacherId, 'documents'] }),
  })
}

export function useDeleteTeacherDocument(teacherId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/teachers/${teacherId}/documents/${docId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers', teacherId, 'documents'] }),
  })
}

export function useUploadMyPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<ApiSuccessResponse<Teacher>>('/teachers/me/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
    },
  })
}
