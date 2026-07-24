import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'

export interface TimetableSlot {
  id: string
  schoolId: string
  classId: string
  academicPeriodId: string
  subjectId: string
  teacherId: string
  weekDay: string
  startTime: string
  endTime: string
  createdAt: string
  subject: { id: string; name: string }
  teacher: { id: string; name: string }
  academicPeriod: { id: string; name: string }
}

export const WEEK_DAY_LABELS: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
}

export const WEEK_DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

interface CreateInput {
  classId: string
  academicPeriodId: string
  subjectId: string
  teacherId: string
  weekDay: string
  startTime: string
  endTime: string
}

interface UpdateInput {
  subjectId?: string
  teacherId?: string
  weekDay?: string
  startTime?: string
  endTime?: string
}

export function useAllTimetableSlots() {
  return useQuery({
    queryKey: ['timetable-slots', 'all'],
    queryFn: async () => (await api.get<TimetableSlot[]>('/timetable-slots')).data,
  })
}

export function useTimetableSlots(classId: string) {
  return useQuery({
    queryKey: ['timetable-slots', classId],
    queryFn: async () => {
      const res = await api.get<TimetableSlot[]>(`/timetable-slots?classId=${classId}`)
      return res.data
    },
    enabled: !!classId,
  })
}

export function useCreateTimetableSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateInput) => {
      const res = await api.post<TimetableSlot>('/timetable-slots', data)
      return res.data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['timetable-slots', vars.classId] })
      qc.invalidateQueries({ queryKey: ['timetable-slots', 'all'] })
    },
  })
}

export function useUpdateTimetableSlot(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInput }) => {
      const res = await api.put<TimetableSlot>(`/timetable-slots/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable-slots', classId] })
      qc.invalidateQueries({ queryKey: ['timetable-slots', 'all'] })
    },
  })
}

export function useDeleteTimetableSlot(classId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/timetable-slots/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable-slots', classId] })
      qc.invalidateQueries({ queryKey: ['timetable-slots', 'all'] })
    },
  })
}
