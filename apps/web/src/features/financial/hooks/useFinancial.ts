import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { Tuition } from '@education-gestor/types'

export function useTuitions(params?: { page?: number; limit?: number }) {
  const { schoolKey, enabled } = useSchoolKey()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  return useQuery({
    queryKey: ['tuitions', schoolKey, { page, limit }],
    queryFn: async () => {
      const res = await api.get<{ data: Tuition[]; total: number }>('/tuitions', {
        params: { page, limit },
      })
      return { data: res.data.data, total: res.data.total }
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
