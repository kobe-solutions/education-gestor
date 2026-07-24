import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
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
      const res = await api.post<School>('/schools', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schools'] }),
  })
}

export function useSchools() {
  return useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await api.get<School[]>('/schools')
      return res.data
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
}

export function useUpdateSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSchoolInput }) => {
      const res = await api.put<School>(`/schools/${id}`, data)
      return res.data
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
