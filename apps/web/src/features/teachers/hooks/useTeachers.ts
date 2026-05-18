import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { Teacher } from '@education-gestor/types'

export type TeacherCreateInput = Pick<Teacher,
  'name' | 'email' |
  'cpf' | 'rg' | 'birthDate' | 'sex' | 'nationality' | 'maritalStatus' | 'phone' |
  'addressCep' | 'addressStreet' | 'addressNumber' | 'addressComplement' |
  'addressNeighborhood' | 'addressCity' | 'addressState' |
  'position' | 'contractType' | 'workload' | 'workShift' |
  'educationLevel' | 'degree' | 'institution' | 'professionalRegistry' |
  'bank' | 'agency' | 'accountNumber' | 'accountType' | 'pixKey'
> & { password: string }

export type TeacherUpdateInput = Partial<Omit<TeacherCreateInput, 'password'>> & {
  employmentStatus?: Teacher['employmentStatus']
}

export function useTeachers() {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['teachers', schoolKey],
    queryFn: async () => {
      const res = await api.get<{ data: Teacher[]; total: number } | Teacher[]>('/teachers')
      const body = res.data
      return Array.isArray(body) ? body : body.data
    },
    enabled,
  })
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: async () => (await api.get<Teacher>(`/teachers/${id}`)).data,
    enabled: !!id,
  })
}

export function useCreateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<TeacherCreateInput> & { name: string; email: string; password: string }) =>
      (await api.post<Teacher>('/teachers', data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

export function useUpdateTeacher(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: TeacherUpdateInput) =>
      (await api.put<Teacher>(`/teachers/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      qc.invalidateQueries({ queryKey: ['teachers', id] })
    },
  })
}

export function useDeleteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/teachers/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teachers'] }),
  })
}

export function useChangeTeacherPassword(id: string) {
  return useMutation({
    mutationFn: async (password: string) => {
      await api.put(`/teachers/${id}/password`, { password })
    },
  })
}
