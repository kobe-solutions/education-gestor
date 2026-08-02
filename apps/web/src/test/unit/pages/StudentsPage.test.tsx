import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../render'
import { StudentsPage } from '../../../features/students/pages/StudentsPage'
import { useStudents } from '../../../features/students/hooks/useStudents'
import { useClass } from '../../../features/classes/hooks/useClasses'
import type { Student } from '@education-gestor/types'

vi.mock('../../../features/students/hooks/useStudents', () => ({
  useStudents: vi.fn(),
  useDeleteStudent: () => ({ mutateAsync: vi.fn(), mutate: vi.fn() }),
}))

vi.mock('../../../features/classes/hooks/useClasses', () => ({
  useClasses: () => ({ data: [{ id: 'class-1', name: '3º Ano A' }] }),
  useClass: vi.fn(() => ({ data: undefined })),
}))

vi.mock('../../../hooks/useApiMutation', () => ({
  useApiMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const mockUseStudents = vi.mocked(useStudents)
const mockUseClass = vi.mocked(useClass)

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

function mockResult(data: Student[] | undefined, total: number, isLoading: boolean) {
  return {
    data: data ? { data, total } : undefined,
    isLoading,
  } as ReturnType<typeof useStudents>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('StudentsPage', () => {
  it('renderiza skeleton durante o loading', () => {
    mockUseStudents.mockReturnValue(mockResult(undefined, 0, true))
    const { container } = renderWithProviders(<StudentsPage />, { initialRoute: '/students' })

    expect(screen.getByText('Alunos')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull()
  })

  it('renderiza a lista de alunos', () => {
    mockUseStudents.mockReturnValue(mockResult([makeStudent(), makeStudent({ id: 'stu-2', name: 'João Souza', enrollmentCode: '2026-0002' })], 2, false))
    renderWithProviders(<StudentsPage />, { initialRoute: '/students' })

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('João Souza')).toBeInTheDocument()
    expect(screen.getByText('2026-0001')).toBeInTheDocument()
  })

  it('renderiza empty state quando não há alunos', () => {
    mockUseStudents.mockReturnValue(mockResult([], 0, false))
    renderWithProviders(<StudentsPage />, { initialRoute: '/students' })

    expect(screen.getByText(/Nenhum aluno cadastrado/)).toBeInTheDocument()
  })

  it('filtra alunos por turma (client-side)', () => {
    mockUseClass.mockReturnValue({
      data: { students: [{ id: 'stu-1' }] },
    } as ReturnType<typeof useClass>)
    mockUseStudents.mockReturnValue(mockResult([
      makeStudent(),
      makeStudent({ id: 'stu-2', name: 'João Souza', enrollmentCode: '2026-0002' }),
    ], 2, false))
    renderWithProviders(<StudentsPage />, { initialRoute: '/students?classId=class-1' })

    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.queryByText('João Souza')).not.toBeInTheDocument()
  })

  it('filtra alunos por range de matrícula (client-side)', () => {
    mockUseStudents.mockReturnValue(mockResult([
      makeStudent({ enrollmentDate: '2026-01-10' }),
      makeStudent({ id: 'stu-2', name: 'João Souza', enrollmentCode: '2026-0002', enrollmentDate: '2026-03-20' }),
    ], 2, false))
    renderWithProviders(<StudentsPage />, { initialRoute: '/students?dateFrom=2026-02-01&dateTo=2026-04-30' })

    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument()
    expect(screen.getByText('João Souza')).toBeInTheDocument()
  })
})
