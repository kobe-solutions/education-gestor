import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'

export interface SchoolEventRecord {
  id: string
  schoolId: string
  title: string
  category: string
  date: string
  startTime: string | null
  endTime: string | null
  allDay: boolean
  location: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface SchoolEventInput {
  title: string
  category: string
  date: string
  startTime: string | null
  endTime: string | null
  allDay: boolean
  location: string | null
  description: string | null
}

export function useSchoolEvents(from: string, to: string) {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['school-events', schoolKey, { from, to }],
    queryFn: async () => (await api.get<SchoolEventRecord[]>('/events', { params: { from, to } })).data,
    enabled,
  })
}

export function useCreateSchoolEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SchoolEventInput) => (await api.post<SchoolEventRecord>('/events', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school-events'] }),
  })
}

export function useUpdateSchoolEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SchoolEventInput }) =>
      (await api.put<SchoolEventRecord>(`/events/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school-events'] }),
  })
}

export function useDeleteSchoolEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/events/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school-events'] }),
  })
}
