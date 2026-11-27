import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../render'
import { GradeGrid } from '../../../features/academic/components/GradeGrid'
import {
  useClassAssessments,
  useClassGradeConfigs,
  useCreateAssessment,
  useUpdateAssessment,
  useDeleteAssessment,
  useUpsertPeriodGradeConfig,
  useRegisterBulkGrades,
} from '../../../features/academic/hooks/useAcademic'
import type { AcademicPeriod, Assessment, Grade, PeriodGradeConfig } from '@education-gestor/types'

vi.mock('../../../features/academic/hooks/useAcademic', () => ({
  useClassAssessments: vi.fn(),
  useClassGradeConfigs: vi.fn(),
  useCreateAssessment: vi.fn(),
  useUpdateAssessment: vi.fn(),
  useDeleteAssessment: vi.fn(),
  useUpsertPeriodGradeConfig: vi.fn(),
  useRegisterBulkGrades: vi.fn(),
}))

const mockPeriods: AcademicPeriod[] = [
  {
    id: 'p1',
    schoolId: 's1',
    academicYearId: 'y1',
    name: '1º Bimestre',
    type: 'bimestre',
    order: 1,
    startDate: '2026-02-01',
    endDate: '2026-04-30',
    gradeClosingDate: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'p2',
    schoolId: 's1',
    academicYearId: 'y1',
    name: '2º Bimestre',
    type: 'bimestre',
    order: 2,
    startDate: '2026-05-01',
    endDate: '2026-07-15',
    gradeClosingDate: null,
    createdAt: '',
    updatedAt: '',
  },
]

const mockAssessments: Assessment[] = [
  {
    id: 'a1',
    schoolId: 's1',
    classId: 'c1',
    subjectId: 'sub1',
    academicPeriodId: 'p1',
    teacherId: 't1',
    name: 'Prova 1',
    weight: '2.00',
    order: 0,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'a2',
    schoolId: 's1',
    classId: 'c1',
    subjectId: 'sub1',
    academicPeriodId: 'p1',
    teacherId: 't1',
    name: 'Trabalho',
    weight: '1.00',
    order: 1,
    createdAt: '',
    updatedAt: '',
  },
]

const mockGrades: Grade[] = [
  {
    id: 'g1',
    classId: 'c1',
    studentId: 'stu1',
    teacherId: 't1',
    subjectId: 'sub1',
    academicPeriodId: 'p1',
    assessmentId: 'a1',
    value: '8.00',
    subject: { id: 'sub1', name: 'Matemática' },
    academicPeriod: { id: 'p1', name: '1º Bimestre' },
    createdAt: '',
  },
  {
    id: 'g2',
    classId: 'c1',
    studentId: 'stu1',
    teacherId: 't1',
    subjectId: 'sub1',
    academicPeriodId: 'p1',
    assessmentId: 'a2',
    value: '5.00',
    subject: { id: 'sub1', name: 'Matemática' },
    academicPeriod: { id: 'p1', name: '1º Bimestre' },
    createdAt: '',
  },
]

const createMutate = vi.fn()
const upsertConfigMutate = vi.fn()
const saveBulkMutate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useClassAssessments).mockReturnValue({ data: mockAssessments } as any)
  vi.mocked(useClassGradeConfigs).mockReturnValue({ data: [] } as any)
  vi.mocked(useCreateAssessment).mockReturnValue({ mutate: createMutate, isPending: false } as any)
  vi.mocked(useUpdateAssessment).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
  vi.mocked(useDeleteAssessment).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
  vi.mocked(useUpsertPeriodGradeConfig).mockReturnValue({ mutate: upsertConfigMutate, isPending: false } as any)
  vi.mocked(useRegisterBulkGrades).mockReturnValue({ mutate: saveBulkMutate, isPending: false } as any)
})

describe('GradeGrid', () => {
  it('calcula média simples entre múltiplas avaliações no bimestre 1', () => {
    renderWithProviders(
      <GradeGrid
        classId="c1"
        subjectId="sub1"
        teacherId="t1"
        students={[{ id: 'stu1', name: 'Maria Silva' }]}
        periods={mockPeriods}
        grades={mockGrades}
      />,
    )

    expect(screen.getByText('Prova 1')).toBeInTheDocument()
    expect(screen.getByText('Trabalho')).toBeInTheDocument()
    // (8.00 + 5.00) / 2 = 6.50
    expect(screen.getByText('6.50')).toBeInTheDocument()
  })

  it('calcula média ponderada quando configuração está como weighted', () => {
    const weightedConfig: PeriodGradeConfig[] = [
      {
        id: 'cfg1',
        schoolId: 's1',
        classId: 'c1',
        subjectId: 'sub1',
        academicPeriodId: 'p1',
        calculationMethod: 'weighted',
        createdAt: '',
        updatedAt: '',
      },
    ]
    vi.mocked(useClassGradeConfigs).mockReturnValue({ data: weightedConfig } as any)

    renderWithProviders(
      <GradeGrid
        classId="c1"
        subjectId="sub1"
        teacherId="t1"
        students={[{ id: 'stu1', name: 'Maria Silva' }]}
        periods={mockPeriods}
        grades={mockGrades}
      />,
    )

    expect(screen.getByText('Peso 2')).toBeInTheDocument()
    expect(screen.getByText('Peso 1')).toBeInTheDocument()
    // (8.00*2 + 5.00*1) / 3 = 7.00
    expect(screen.getByText('7.00')).toBeInTheDocument()
  })

  it('permite alternar o método de cálculo para Média Ponderada', () => {
    renderWithProviders(
      <GradeGrid
        classId="c1"
        subjectId="sub1"
        teacherId="t1"
        students={[{ id: 'stu1', name: 'Maria Silva' }]}
        periods={mockPeriods}
        grades={mockGrades}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Média Ponderada' }))
    expect(upsertConfigMutate).toHaveBeenCalledWith(
      {
        classId: 'c1',
        subjectId: 'sub1',
        academicPeriodId: 'p1',
        calculationMethod: 'weighted',
      },
      expect.any(Object),
    )
  })

  it('abre modal para adicionar nova avaliação e envia dados', () => {
    renderWithProviders(
      <GradeGrid
        classId="c1"
        subjectId="sub1"
        teacherId="t1"
        students={[{ id: 'stu1', name: 'Maria Silva' }]}
        periods={mockPeriods}
        grades={mockGrades}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Adicionar avaliação/i }))
    fireEvent.change(screen.getByLabelText(/Nome da avaliação/i), { target: { value: 'Seminário' } })
    fireEvent.change(screen.getByLabelText(/Peso/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar avaliação' }))

    expect(createMutate).toHaveBeenCalledWith(
      {
        classId: 'c1',
        subjectId: 'sub1',
        academicPeriodId: 'p1',
        teacherId: 't1',
        name: 'Seminário',
        weight: 3,
      },
      expect.any(Object),
    )
  })
})
