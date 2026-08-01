import { describe, it, expect, vi, beforeEach } from 'vitest'
import axe from 'axe-core'
import { renderWithProviders } from '../../render'
import { LoginPage } from '../../../features/auth/pages/LoginPage'
import { StudentsPage } from '../../../features/students/pages/StudentsPage'
import { useStudents } from '../../../features/students/hooks/useStudents'
import type { Student } from '@education-gestor/types'

vi.mock('../../../features/students/hooks/useStudents', () => ({
  useStudents: vi.fn(),
  useDeleteStudent: () => ({ mutateAsync: vi.fn(), mutate: vi.fn() }),
}))

vi.mock('../../../hooks/useApiMutation', () => ({
  useApiMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const mockUseStudents = vi.mocked(useStudents)

const auth = {
  token: 'token',
  payload: { userId: 'u1', schoolId: 'school-1', name: 'Gestor', role: 'gestor' as const },
}

async function runAxe(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // jsdom não computa layout real, então contraste e regras dependentes de estilo são ignorados
      'color-contrast': { enabled: false },
      'link-in-text-block': { enabled: false },
    },
  })
  return results.violations
}

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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Acessibilidade (axe-core)', () => {
  it('LoginPage não apresenta violações de acessibilidade', async () => {
    const { container } = renderWithProviders(<LoginPage />, { initialRoute: '/login' })

    const violations = await runAxe(container)

    expect(violations).toEqual([])
  })

  it('StudentsPage com lista não apresenta violações de acessibilidade', async () => {
    mockUseStudents.mockReturnValue({
      data: { data: [makeStudent()], total: 1 },
      isLoading: false,
    } as ReturnType<typeof useStudents>)

    const { container } = renderWithProviders(<StudentsPage />, {
      initialRoute: '/students',
      mockAuth: auth,
    })

    const violations = await runAxe(container)

    expect(violations).toEqual([])
  })
})
