import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { Student, Guardian } from '@education-gestor/types'

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await api.get<Student[]>('/students')
      return res.data
    },
  })
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const res = await api.get<Student>(`/students/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useStudentGuardians(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'guardians'],
    queryFn: async () => {
      const res = await api.get<Guardian[]>(`/students/${studentId}/guardians`)
      return res.data
    },
    enabled: !!studentId,
  })
}

interface CreateStudentInput {
  name: string
  email?: string
  birthDate?: string
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateStudentInput) => {
      const res = await api.post<Student>('/students', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}

export function useUpdateStudent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<CreateStudentInput>) => {
      const res = await api.put<Student>(`/students/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['students', id] })
    },
  })
}

export function useDeleteStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/students/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}

interface AddGuardianInput {
  name: string
  email?: string
  phone?: string
  relationship: string
}

export function useAddGuardian(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: AddGuardianInput) => {
      const res = await api.post<Guardian>(`/students/${studentId}/guardians`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] }),
  })
}
