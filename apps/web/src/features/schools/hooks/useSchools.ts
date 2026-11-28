import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type ApiSuccessResponse } from '../../../lib/api'
import type { School } from '@education-gestor/types'

interface CreateSchoolInput {
  name: string
  slug: string
  email: string
  password: string
  director?: string
  coordinator?: string
  phone?: string
  address?: string
}

export function useCreateSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateSchoolInput) => {
      const res = await api.post<ApiSuccessResponse<School>>('/schools', data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schools'] }),
  })
}

export function useSchool(id: string) {
  return useQuery({
    queryKey: ['schools', id],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<School>>(`/schools/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useSchools() {
  return useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<School[]>>('/schools')
      return res.data.data
    },
  })
}

interface UpdateSchoolInput {
  name?: string
  slug?: string
  email?: string
  director?: string | null
  coordinator?: string | null
  phone?: string | null
  address?: string | null
  minPassingGrade?: number
  minAttendancePercentage?: number
}

export function useMySchool(enabled = true) {
  return useQuery({
    queryKey: ['schools', 'me'],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<School>>('/schools/me')
      return res.data.data
    },
    enabled,
  })
}

export function useUpdateMySchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateSchoolInput) => {
      const res = await api.put<ApiSuccessResponse<School>>('/schools/me', data)
      return res.data.data
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['schools'] })
      if (updated?.id) qc.invalidateQueries({ queryKey: ['schools', updated.id] })
      qc.invalidateQueries({ queryKey: ['student-report'] })
    },
  })
}

export function useChangeMySchoolPassword() {
  return useMutation({
    mutationFn: async (password: string) => {
      await api.put('/schools/me/password', { password })
    },
  })
}

export function useUploadMySchoolLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<ApiSuccessResponse<School>>('/schools/me/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data.data
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['schools'] })
      if (updated?.id) qc.invalidateQueries({ queryKey: ['schools', updated.id] })
    },
  })
}

export function useUpdateSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSchoolInput }) => {
      const res = await api.put<ApiSuccessResponse<School>>(`/schools/${id}`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schools'] }),
  })
}

export function useDeleteSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/schools/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schools'] }),
  })
}

export function usePermanentDeleteSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/schools/${id}/permanent`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schools'] }),
  })
}

export function useChangeSchoolPassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      await api.put(`/schools/${id}/password`, { password })
    },
  })
}

export function useUploadSchoolLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<ApiSuccessResponse<School>>(`/schools/${id}/logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schools'] }),
  })
}

export function useToggleSchoolFinancialVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiSuccessResponse<School>>(`/schools/${id}/financial-visibility`)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schools'] }),
  })
}
