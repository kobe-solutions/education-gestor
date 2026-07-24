import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { Secretaria, School } from '@education-gestor/types'

export function useSecretarias() {
  return useQuery({
    queryKey: ['secretarias'],
    queryFn: async () => {
      const res = await api.get<Secretaria[]>('/secretarias')
      return res.data
    },
  })
}

export function useSecretariaSchools(secretariaId: string) {
  return useQuery({
    queryKey: ['secretarias', secretariaId, 'schools'],
    queryFn: async () => {
      const res = await api.get<School[]>(`/secretarias/${secretariaId}/schools`)
      return res.data
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
      const res = await api.post<Secretaria>('/secretarias', data)
      return res.data
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
      const res = await api.put<Secretaria>(`/secretarias/${id}`, data)
      return res.data
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
