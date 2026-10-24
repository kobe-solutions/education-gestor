import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'

export interface LessonRecord {
  id: string
  teacherId: string
  teacherName: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  timetableSlotId: string | null
  date: string
  title: string
  topic: string
  description: string | null
  attachments: Array<{ name: string; url: string; contentType: string; size: number }>
  createdAt: string
}

export interface LessonRecordSummary {
  month: string
  planned: number
  registered: number
  pending: number
  future: number
  rate: number
}

export function useLessonRecordSummary(month?: string) {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['lesson-record-summary', schoolKey, month],
    queryFn: async () => (await api.get<LessonRecordSummary>('/lesson-records/summary', { params: month ? { month } : {} })).data,
    enabled,
    staleTime: 60_000,
  })
}

export function useLessonRecords(month: string, filters: { teacherId?: string; classId?: string } = {}) {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['lesson-records', schoolKey, month, filters.teacherId, filters.classId],
    queryFn: async () => (await api.get<LessonRecord[]>('/lesson-records', { params: { from: `${month}-01`, to: `${month}-31`, ...filters } })).data,
    enabled,
  })
}

export function useCreateLessonRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (form: FormData) => (await api.post<LessonRecord>('/lesson-records', form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-records'] })
      qc.invalidateQueries({ queryKey: ['lesson-record-summary'] })
    },
  })
}

export function useUpdateLessonRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FormData }) =>
      (await api.put<LessonRecord>(`/lesson-records/${id}`, form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-records'] })
      qc.invalidateQueries({ queryKey: ['lesson-record-summary'] })
    },
  })
}

export function useDeleteLessonRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/lesson-records/${id}`) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-records'] })
      qc.invalidateQueries({ queryKey: ['lesson-record-summary'] })
    },
  })
}
