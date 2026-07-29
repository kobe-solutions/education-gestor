import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { Tuition } from '@education-gestor/types'

export function useTuitions(params?: { page?: number; limit?: number; status?: string }) {
  const { schoolKey, enabled } = useSchoolKey()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const status = params?.status && params.status !== 'all' ? params.status : undefined
  return useQuery({
    queryKey: ['tuitions', schoolKey, { page, limit, status }],
    queryFn: async () => {
      const res = await api.get<{ data: Tuition[]; total: number }>('/tuitions', {
        params: { page, limit, ...(status ? { status } : {}) },
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
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tuitions'] })
      qc.invalidateQueries({ queryKey: ['tuitions', 'student', variables.studentId] })
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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tuitions'] })
      if (data?.studentId) {
        qc.invalidateQueries({ queryKey: ['tuitions', 'student', data.studentId] })
      }
    },
  })
}

export function useUploadTuitionBoleto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<Tuition>(`/tuitions/${id}/boleto`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tuitions'] }),
  })
}

export function useUploadTuitionReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<Tuition>(`/tuitions/${id}/receipt`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tuitions'] }),
  })
}
