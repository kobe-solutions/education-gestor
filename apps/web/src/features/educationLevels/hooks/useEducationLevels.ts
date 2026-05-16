import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'

export interface EducationLevel {
  id: string
  schoolId: string
  type: string
  modality: string | null
  name: string
  active: boolean
  createdAt: string
}

export const EDUCATION_LEVEL_TYPE_LABELS: Record<string, string> = {
  infantil_creche: 'Creche (0–3 anos)',
  infantil_pre_escola: 'Pré-escola (4–5 anos)',
  fundamental_1: 'Ensino Fundamental 1 (1º–5º ano)',
  fundamental_2: 'Ensino Fundamental 2 (6º–9º ano)',
  medio: 'Ensino Médio',
  tecnico: 'Ensino Técnico',
  superior: 'Ensino Superior',
}

export const EDUCATION_MODALITY_LABELS: Record<string, string> = {
  eja: 'EJA',
  integral: 'Integral',
  profissionalizante: 'Profissionalizante',
  especial: 'Especial',
}

interface CreateInput {
  type: string
  modality?: string
  name: string
  active?: boolean
}

interface UpdateInput {
  type?: string
  modality?: string | null
  name?: string
  active?: boolean
}

export function useEducationLevels() {
  return useQuery({
    queryKey: ['education-levels'],
    queryFn: async () => {
      const res = await api.get<EducationLevel[]>('/education-levels')
      return res.data
    },
  })
}

export function useCreateEducationLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateInput) => {
      const res = await api.post<EducationLevel>('/education-levels', data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['education-levels'] }),
  })
}

export function useUpdateEducationLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInput }) => {
      const res = await api.put<EducationLevel>(`/education-levels/${id}`, data)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['education-levels'] }),
  })
}

export function useDeleteEducationLevel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/education-levels/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['education-levels'] }),
  })
}
