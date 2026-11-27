import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type ApiSuccessResponse } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { Tuition } from '@education-gestor/types'

export type TuitionClassOption = {
  id: string
  name: string
}

type TuitionsResponse = {
  data: Tuition[]
  total: number
  classes?: TuitionClassOption[]
}

export function useTuitions(params?: { page?: number; limit?: number; status?: string }) {
  const { schoolKey, enabled } = useSchoolKey()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 50
  const status = params?.status && params.status !== 'all' ? params.status : undefined
  return useQuery({
    queryKey: ['tuitions', schoolKey, { page, limit, status }],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<TuitionsResponse>>('/tuitions', {
        params: { page, limit, ...(status ? { status } : {}) },
      })
      return {
        data: res.data.data.data,
        total: res.data.data.total,
        classes: res.data.data.classes ?? [],
      }
    },
    enabled,
  })
}

export function useStudentTuitions(studentId: string) {
  return useQuery({
    queryKey: ['tuitions', 'student', studentId],
    queryFn: async () => {
      const res = await api.get<ApiSuccessResponse<Tuition[]>>(`/students/${studentId}/tuitions`)
      return res.data.data
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
      const res = await api.post<ApiSuccessResponse<Tuition>>('/tuitions', data)
      return res.data.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tuitions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['tuitions', 'student', variables.studentId] })
    },
  })
}

export function useUpdateTuition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { amount: number; dueDate: string } }) => {
      const res = await api.patch<ApiSuccessResponse<Tuition>>(`/tuitions/${id}`, data)
      return res.data.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tuitions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      if (data?.studentId) {
        qc.invalidateQueries({ queryKey: ['tuitions', 'student', data.studentId] })
      }
    },
  })
}

export function useRegisterPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tuitionId: string) => {
      const res = await api.patch<ApiSuccessResponse<Tuition>>(`/tuitions/${tuitionId}/pay`)
      return res.data.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tuitions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
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
      return (await api.post<ApiSuccessResponse<Tuition>>(`/tuitions/${id}/boleto`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data.data
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
      return (await api.post<ApiSuccessResponse<Tuition>>(`/tuitions/${id}/receipt`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tuitions'] }),
  })
}
