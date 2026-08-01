import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../render'
import { TuitionsPage } from '../../../features/financial/pages/TuitionsPage'
import { useTuitions, useRegisterPayment, useUploadTuitionBoleto, useUploadTuitionReceipt } from '../../../features/financial/hooks/useFinancial'
import { useFinancialBlocked } from '../../../lib/useFinancialBlocked'
import { useStudents } from '../../../features/students/hooks/useStudents'
import type { Tuition } from '@education-gestor/types'

vi.mock('../../../features/financial/hooks/useFinancial', () => ({
   useTuitions: vi.fn(),
   useCreateTuition: () => ({ mutateAsync: vi.fn() }),
   useUpdateTuition: () => ({ mutateAsync: vi.fn() }),
   useRegisterPayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
   useUploadTuitionBoleto: () => ({ mutate: vi.fn() }),
   useUploadTuitionReceipt: () => ({ mutate: vi.fn() }),
}))

vi.mock('../../../features/students/hooks/useStudents', () => ({
  useStudents: vi.fn(() => ({ data: { data: [] }, isLoading: false })),
}))

vi.mock('../../../lib/useFinancialBlocked', () => ({
  useFinancialBlocked: vi.fn(() => ({ blocked: false, loading: false })),
}))

const mockUseTuitions = vi.mocked(useTuitions)
const mockUseFinancialBlocked = vi.mocked(useFinancialBlocked)
const mockUseStudents = vi.mocked(useStudents)

function makeTuition(overrides: Partial<Tuition> = {}): Tuition {
  return {
    id: 'tui-1',
    schoolId: 'school-1',
    studentId: 'stu-1',
    studentName: 'Maria Silva',
    amount: '1500.00',
    dueDate: '2026-03-10',
    paidAt: null,
    status: 'pending',
    boletoUrl: null,
    boletoFileSize: null,
    receiptUrl: null,
    receiptFileSize: null,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    ...overrides,
  }
}

function mockResult(data: Tuition[] | undefined, total: number, isLoading: boolean) {
  return {
    data: data ? { data, total } : undefined,
    total,
    isLoading,
  } as unknown as ReturnType<typeof useTuitions>
}

const STORAGE_KEY = 'iris-hide-financial'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.removeItem(STORAGE_KEY)
  mockUseFinancialBlocked.mockReturnValue({ blocked: false, loading: false })
  mockUseStudents.mockReturnValue({ data: { data: [] }, isLoading: false } as never)
})

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY)
})

describe('TuitionsPage', () => {
  it('renderiza a lista de mensalidades', () => {
    mockUseTuitions.mockReturnValue(mockResult([
      makeTuition(),
      makeTuition({ id: 'tui-2', studentId: 'stu-2', studentName: 'João Souza', amount: '900.50', status: 'paid' }),
    ], 2, false))

    renderWithProviders(<TuitionsPage />, { initialRoute: '/financial' })

    expect(screen.getByText('Mensalidades')).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('João Souza')).toBeInTheDocument()
    expect(screen.getByText('2 cobranças encontradas')).toBeInTheDocument()
  })

  it('mostra empty state quando não há mensalidades', () => {
    mockUseTuitions.mockReturnValue(mockResult([], 0, false))

    renderWithProviders(<TuitionsPage />, { initialRoute: '/financial' })

    expect(screen.getByText('Nenhuma mensalidade encontrada')).toBeInTheDocument()
  })

  it('oculta dados financeiros quando configurado', () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    mockUseTuitions.mockReturnValue(mockResult([makeTuition()], 1, false))

    renderWithProviders(<TuitionsPage />, { initialRoute: '/financial' })

    expect(screen.getByText('Dados financeiros ocultos')).toBeInTheDocument()
    expect(screen.queryByText('Mensalidades')).not.toBeInTheDocument()
  })

  it('mostra aviso de bloqueio quando a escola não libera financeiro', () => {
    mockUseTuitions.mockReturnValue(mockResult([makeTuition()], 1, false))
    mockUseFinancialBlocked.mockReturnValue({ blocked: true, loading: false })

    renderWithProviders(<TuitionsPage />, { initialRoute: '/financial' })

    expect(screen.getByText('Dados financeiros ocultos')).toBeInTheDocument()
  })
})
