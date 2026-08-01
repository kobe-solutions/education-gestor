import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useParams } from 'react-router'
import { renderWithProviders } from '../../render'
import { StudentFormPage } from '../../../features/students/pages/StudentFormPage'
import { useStudent } from '../../../features/students/hooks/useStudents'
import type { Student } from '@education-gestor/types'

vi.mock('../../../features/students/hooks/useStudents', () => ({
  useStudent: vi.fn(),
  useCreateStudent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateStudent: () => ({ mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false }),
  useUploadStudentPhoto: () => ({ mutate: vi.fn(), isPending: false }),
  useStudentGuardians: () => ({ data: [] }),
  useAddGuardian: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteGuardian: () => ({ mutate: vi.fn() }),
  useStudentMedical: () => ({ data: undefined }),
  useUpsertMedical: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useStudentDocuments: () => ({ data: [] }),
  useUploadDocument: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteDocument: () => ({ mutate: vi.fn() }),
}))

vi.mock('../../../features/classes/hooks/useClasses', () => ({
  useClasses: () => ({ data: [] }),
  useStudentClasses: () => ({ data: [] }),
  useAddStudentToClass: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('../../../features/secretarias/hooks/useSecretarias', () => ({
  useSecretariaSchools: () => ({ data: [], isLoading: false }),
}))

vi.mock('../../../lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockUseStudent = vi.mocked(useStudent)

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useParams: vi.fn(() => ({})) }
})

const mockUseParams = vi.mocked(useParams)

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 'stu-1',
    schoolId: 'school-1',
    name: 'Maria Silva',
    email: null,
    cpf: null,
    rg: null,
    birthDate: null,
    sex: null,
    bloodType: null,
    naturalidade: null,
    photoUrl: null,
    phone: null,
    motherName: null,
    fatherName: null,
    motherPhone: null,
    addressCep: null,
    addressStreet: null,
    addressNumber: null,
    addressComplement: null,
    addressNeighborhood: null,
    addressCity: null,
    addressState: null,
    comorbidities: null,
    observations: null,
    enrollmentCode: '2026-0001',
    internalCode: null,
    enrollmentStatus: 'active',
    enrollmentDate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const auth = {
  token: 'token',
  payload: { userId: 'u1', schoolId: 'school-1', name: 'Gestor', role: 'gestor' as const },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseStudent.mockReturnValue({ data: undefined, isLoading: false } as ReturnType<typeof useStudent>)
})

describe('StudentFormPage', () => {
  it('renderiza o formulário de criação com todas as abas', () => {
    renderWithProviders(<StudentFormPage />, { initialRoute: '/students/new', mockAuth: auth })

    expect(screen.getByRole('heading', { name: 'Novo aluno' })).toBeInTheDocument()
    expect(screen.getByText('Dados Pessoais')).toBeInTheDocument()
    expect(screen.getByText('Matrícula & Turmas')).toBeInTheDocument()
  })

  it('mostra erros de validação ao submeter o formulário vazio', async () => {
    const user = userEvent.setup()

    renderWithProviders(<StudentFormPage />, { initialRoute: '/students/new', mockAuth: auth })

    await user.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    expect(await screen.findByText('Nome obrigatório')).toBeInTheDocument()
  })

  it('renderiza o modo de edição com os dados do aluno carregados', () => {
    mockUseParams.mockReturnValue({ id: 'stu-1' })
    mockUseStudent.mockReturnValue({ data: makeStudent(), isLoading: false } as ReturnType<typeof useStudent>)

    renderWithProviders(<StudentFormPage />, { initialRoute: '/students/stu-1/edit', mockAuth: auth })

    expect(screen.getByRole('heading', { name: 'Maria Silva' })).toBeInTheDocument()
    expect(screen.getByText(/Matrícula: 2026-0001/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver detalhes' })).toBeInTheDocument()
  })
})
