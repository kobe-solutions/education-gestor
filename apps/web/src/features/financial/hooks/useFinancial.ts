import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { Tuition } from '@education-gestor/types'

export function useTuitions() {
  return useQuery({
    queryKey: ['tuitions'],
    queryFn: async () => {
      const res = await api.get<Tuition[]>('/tuitions')
      return res.data
    },
  })
}

export function useStudentTuitions(studentId: string) {
  return useQuery({
    queryKey: ['tuitions', 'student', studentId],
    queryFn: async () => {
      const res = await api.get<Tuition[]>(`/students/${studentId}/tuitions`)
      return res.data
    },
    enabled: !!studentId,
  })
}

interface CreateTuitionInput {
  studentId: string
  amount: number
  dueDate: string
}

export function useCreateTuition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateTuitionInput) => {
      const res = await api.post<Tuition>('/tuitions', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tuitions'] })
    },
  })
}

export function useRegisterPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tuitionId: string) => {
      const res = await api.patch<Tuition>(`/tuitions/${tuitionId}/pay`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tuitions'] })
    },
  })
}
