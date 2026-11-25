import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type ApiSuccessResponse } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { AcademicYear, AcademicPeriod } from '@education-gestor/types'

// ─── Anos letivos ─────────────────────────────────────────────────────────────

export function useAcademicYears() {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['academic-years', schoolKey],
    queryFn: async () => (await api.get<ApiSuccessResponse<AcademicYear[]>>('/academic-years')).data.data,
    enabled,
  })
}

export function useCreateAcademicYear() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      year: number
      name: string
      startDate: string
      endDate: string
      registrationStart?: string
      registrationEnd?: string
    }) => (await api.post<ApiSuccessResponse<AcademicYear>>('/academic-years', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-years'] }),
  })
}

export function useUpdateAcademicYear() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string
      data: { name?: string; startDate?: string; endDate?: string; registrationStart?: string | null; registrationEnd?: string | null }
    }) => (await api.put<ApiSuccessResponse<AcademicYear>>(`/academic-years/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-years'] }),
  })
}

export function useUpdateAcademicYearStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'planning' | 'active' | 'closed' }) =>
      (await api.patch<ApiSuccessResponse<AcademicYear>>(`/academic-years/${id}/status`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-years'] }),
  })
}

export function useDeleteAcademicYear() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete<ApiSuccessResponse<null>>(`/academic-years/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-years'] }),
  })
}

// ─── Períodos letivos ─────────────────────────────────────────────────────────

export function useAcademicPeriods(yearId: string) {
  return useQuery({
    queryKey: ['academic-periods', yearId],
    queryFn: async () => (await api.get<ApiSuccessResponse<AcademicPeriod[]>>(`/academic-years/${yearId}/periods`)).data.data,
    enabled: !!yearId,
  })
}

export function useCreateAcademicPeriod(yearId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      type: 'bimestre' | 'trimestre' | 'semestre'
      order: number
      startDate: string
      endDate: string
      gradeClosingDate?: string
    }) => (await api.post<ApiSuccessResponse<AcademicPeriod>>(`/academic-years/${yearId}/periods`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-periods', yearId] }),
  })
}

export function useUpdateAcademicPeriod(yearId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string
      data: { name?: string; type?: string; order?: number; startDate?: string; endDate?: string; gradeClosingDate?: string | null }
    }) => (await api.put<ApiSuccessResponse<AcademicPeriod>>(`/academic-years/${yearId}/periods/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-periods', yearId] }),
  })
}

export function useDeleteAcademicPeriod(yearId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.delete<ApiSuccessResponse<null>>(`/academic-years/${yearId}/periods/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['academic-periods', yearId] }),
  })
}
