import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { Secretaria, School } from '@education-gestor/types'

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
