import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { Subject } from '@education-gestor/types'

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await api.get<Subject[]>('/subjects')
      return res.data
    },
  })
}

interface CreateSubjectInput {
  name: string
  code?: string
  weeklyHours: number
}

interface UpdateSubjectInput {
  name?: string
  code?: string | null
  weeklyHours?: number
}

export function useCreateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateSubjectInput) => {
      const res = await api.post<Subject>('/subjects', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })
}

export function useUpdateSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSubjectInput }) => {
      const res = await api.put<Subject>(`/subjects/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })
}

export function useDeleteSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subjects/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }),
  })
}
