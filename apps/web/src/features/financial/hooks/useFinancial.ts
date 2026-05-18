import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { Tuition } from '@education-gestor/types'

export function useTuitions() {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['tuitions', schoolKey],
    queryFn: async () => {
      const res = await api.get<{ data: Tuition[]; total: number } | Tuition[]>('/tuitions')
      const body = res.data
      return Array.isArray(body) ? body : body.data
    },
    enabled,
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
