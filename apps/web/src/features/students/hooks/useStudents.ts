import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { Student, Guardian, StudentMedical, StudentDocument } from '@education-gestor/types'

// ─── Alunos ────────────────────────────────────────────────────────────────────

export function useStudents() {
  const { schoolKey, enabled } = useSchoolKey()
  return useQuery({
    queryKey: ['students', schoolKey],
    queryFn: async () => {
      const res = await api.get<{ data: Student[]; total: number } | Student[]>('/students')
      const body = res.data
      return Array.isArray(body) ? body : body.data
    },
    enabled,
  })
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => (await api.get<Student>(`/students/${id}`)).data,
    enabled: !!id,
  })
}

export type CreateStudentInput = Pick<Student,
  'name' | 'email' | 'cpf' | 'rg' | 'birthDate' | 'sex' | 'bloodType' | 'naturalidade' | 'phone' |
  'motherName' | 'fatherName' | 'motherPhone' |
  'addressCep' | 'addressStreet' | 'addressNumber' | 'addressComplement' |
  'addressNeighborhood' | 'addressCity' | 'addressState' |
  'comorbidities' | 'observations' | 'enrollmentDate' | 'internalCode'
>

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<CreateStudentInput> & { name: string }) => {
      return (await api.post<Student>('/students', data)).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}

export function useUpdateStudent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<CreateStudentInput> & { enrollmentStatus?: string }) => {
      return (await api.put<Student>(`/students/${id}`, data)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['students', id] })
    },
  })
}

export function useDeleteStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/students/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students'] }),
  })
}

// ─── Foto ─────────────────────────────────────────────────────────────────────

export function useUploadStudentPhoto(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<Student>(`/students/${studentId}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', studentId] })
      qc.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

// ─── Responsáveis ─────────────────────────────────────────────────────────────

export function useStudentGuardians(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'guardians'],
    queryFn: async () => (await api.get<Guardian[]>(`/students/${studentId}/guardians`)).data,
    enabled: !!studentId,
  })
}

export type GuardianInput = Omit<Guardian, 'id' | 'studentId' | 'createdAt'>

export function useAddGuardian(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: GuardianInput) =>
      (await api.post<Guardian>(`/students/${studentId}/guardians`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] }),
  })
}

export function useUpdateGuardian(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GuardianInput> }) =>
      (await api.put<Guardian>(`/students/${studentId}/guardians/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] }),
  })
}

export function useDeleteGuardian(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (guardianId: string) => {
      await api.delete(`/students/${studentId}/guardians/${guardianId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] }),
  })
}

// ─── Ficha médica ──────────────────────────────────────────────────────────────

export function useStudentMedical(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'medical'],
    queryFn: async () => (await api.get<StudentMedical>(`/students/${studentId}/medical`)).data,
    enabled: !!studentId,
  })
}

export function useUpsertMedical(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Omit<StudentMedical, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>>) =>
      (await api.put<StudentMedical>(`/students/${studentId}/medical`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', studentId, 'medical'] }),
  })
}

// ─── Documentos ────────────────────────────────────────────────────────────────

export function useStudentDocuments(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'documents'],
    queryFn: async () => (await api.get<StudentDocument[]>(`/students/${studentId}/documents`)).data,
    enabled: !!studentId,
  })
}

export function useUploadDocument(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.post<StudentDocument>(
        `/students/${studentId}/documents?type=${type}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', studentId, 'documents'] }),
  })
}

export function useDeleteDocument(studentId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (docId: string) => {
      await api.delete(`/students/${studentId}/documents/${docId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['students', studentId, 'documents'] }),
  })
}
