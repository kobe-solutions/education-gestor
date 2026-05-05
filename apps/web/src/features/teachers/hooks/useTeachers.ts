import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { Teacher } from '@education-gestor/types'

export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const res = await api.get<Teacher[]>('/teachers')
      return res.data
    },
  })
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: async () => {
      const res = await api.get<Teacher>(`/teachers/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

interface TeacherInput {
  name: string
  email: string
  password?: string
}

export function useCreateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: TeacherInput) => {
      const res = await api.post<Teacher>('/teachers', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

export function useUpdateTeacher(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<TeacherInput>) => {
      const res = await api.put<Teacher>(`/teachers/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      qc.invalidateQueries({ queryKey: ['teachers', id] })
    },
  })
}

export function useDeleteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/teachers/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}
