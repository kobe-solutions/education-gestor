import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type ApiSuccessResponse } from '../../../lib/api'
import type { EducationLevel } from '../../educationLevels/hooks/useEducationLevels'

export interface Serie {
  id: string
  schoolId: string
  educationLevelId: string
  name: string
  order: number
  createdAt: string
  educationLevel: Pick<EducationLevel, 'id' | 'name' | 'type'> | null
}

interface CreateInput {
  educationLevelId: string
  name: string
  order?: number
}

interface UpdateInput {
  name?: string
  order?: number
}

export function useSeries(educationLevelId?: string) {
  return useQuery({
    queryKey: ['series', educationLevelId],
    queryFn: async () => {
      const params = educationLevelId ? `?educationLevelId=${educationLevelId}` : ''
      const res = await api.get<ApiSuccessResponse<Serie[]>>(`/series${params}`)
      return res.data.data
    },
  })
}

export function useCreateSerie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateInput) => {
      const res = await api.post<ApiSuccessResponse<Serie>>('/series', data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['series'] }),
  })
}

export function useUpdateSerie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInput }) => {
      const res = await api.put<ApiSuccessResponse<Serie>>(`/series/${id}`, data)
      return res.data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['series'] }),
  })
}

export function useDeleteSerie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/series/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['series'] }),
  })
}
