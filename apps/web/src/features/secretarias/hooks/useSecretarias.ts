import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type ApiSuccessResponse } from '../../../lib/api'
import type { Secretaria, School } from '@education-gestor/types'

export function useSecretarias() {
  return useQuery({
    queryKey: ['secretarias'],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<Secretaria[]>>('/secretarias')
      return res.data.data
    },
  })
}

export function useSecretariaSchools(secretariaId: string) {
  return useQuery({
    queryKey: ['secretarias', secretariaId, 'schools'],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<School[]>>(`/secretarias/${secretariaId}/schools`)
      return res.data.data
    },
    enabled: !!secretariaId,
  })
}

interface CreateSecretariaInput {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  responsible?: string
}

export function useCreateSecretaria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateSecretariaInput) => {
      const res = await api.post<ApiSuccessResponse<Secretaria>>('/secretarias', data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['secretarias'] }),
  })
}

interface UpdateSecretariaInput {
  name?: string
  email?: string
  phone?: string | null
  address?: string | null
  responsible?: string | null
  active?: boolean
}

export function useUpdateSecretaria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSecretariaInput }) => {
      const res = await api.put<ApiSuccessResponse<Secretaria>>(`/secretarias/${id}`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['secretarias'] }),
  })
}

export function useDeleteSecretaria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/secretarias/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['secretarias'] }),
  })
}

export function useLinkSchool(secretariaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (schoolId: string) => {
      await api.post(`/secretarias/${secretariaId}/schools`, { schoolId })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['secretarias', secretariaId, 'schools'] }),
  })
}

export function useUnlinkSchool(secretariaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (schoolId: string) => {
      await api.delete(`/secretarias/${secretariaId}/schools/${schoolId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['secretarias', secretariaId, 'schools'] }),
  })
}

export function useChangeSecretariaPassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      await api.put(`/secretarias/${id}/password`, { password })
    },
  })
}

export function useChangeSchoolPassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      await api.put(`/schools/${id}/password`, { password })
    },
  })
}

export function useUploadSecretariaLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<ApiSuccessResponse<Secretaria>>(`/secretarias/${id}/logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['secretarias'] }),
  })
}

export function useToggleSecretariaFinancialVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiSuccessResponse<Secretaria>>(`/secretarias/${id}/financial-visibility`)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['secretarias'] }),
  })
}
