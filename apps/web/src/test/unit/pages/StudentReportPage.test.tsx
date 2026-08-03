import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../render'
import { StudentReportPage } from '../../../features/academic/pages/StudentReportPage'
import { useStudentReport } from '../../../features/academic/hooks/useAcademic'
import { useStudent } from '../../../features/students/hooks/useStudents'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import { useSchool } from '../../../features/schools/hooks/useSchools'
import type { StudentReport } from '@education-gestor/types'

vi.mock('../../../features/academic/hooks/useAcademic', () => ({
  useStudentReport: vi.fn(),
  useStudentGrades: vi.fn(),
  useStudentAttendances: vi.fn(),
  useClassGrades: vi.fn(),
  useRegisterGrade: vi.fn(),
  useRegisterBulkGrades: vi.fn(),
  useClassAttendance: vi.fn(),
  useRegisterBulkAttendance: vi.fn(),
}))

vi.mock('../../../features/students/hooks/useStudents', () => ({
  useStudent: vi.fn(() => ({ data: { id: 'stu-1', name: 'Maria Silva' } })),
}))

vi.mock('../../../lib/useSchoolKey', () => ({
  useSchoolKey: vi.fn(() => ({ schoolKey: 'school-1', enabled: true })),
}))

vi.mock('../../../features/schools/hooks/useSchools', () => ({
  useSchool: vi.fn(() => ({ data: { id: 'school-1', name: 'Colégio Exemplo' } })),
}))

const mockUseStudentReport = vi.mocked(useStudentReport)
const mockUseStudent = vi.mocked(useStudent)
const mockUseSchoolKey = vi.mocked(useSchoolKey)
const mockUseSchool = vi.mocked(useSchool)

function makeReport(overrides: Partial<StudentReport> = {}): StudentReport {
  return {
    studentId: 'stu-1',
    studentName: 'Maria Silva',
    enrollmentCode: 'MAT001',
    periods: [
      { id: 'p1', name: '1º Bimestre', order: 1 },
      { id: 'p2', name: '2º Bimestre', order: 2 },
    ],
    subjects: [
      {
        subjectId: 'math',
        subjectName: 'Matemática',
        classId: 'class-1',
        className: '9º A',
        grades: [
          { academicPeriodId: 'p1', academicPeriodName: '1º Bimestre', value: '8.0' },
          { academicPeriodId: 'p2', academicPeriodName: '2º Bimestre', value: '6.0' },
        ],
        average: 7,
        status: 'approved',
        attendance: { rate: 80, presentCount: 4, totalCount: 5 },
      },
      {
        subjectId: 'port',
        subjectName: 'Português',
        classId: 'class-1',
        className: '9º A',
        grades: [
          { academicPeriodId: 'p1', academicPeriodName: '1º Bimestre', value: '4.0' },
          { academicPeriodId: 'p2', academicPeriodName: '2º Bimestre', value: '3.0' },
        ],
        average: 3.5,
        status: 'recovery',
        attendance: { rate: 80, presentCount: 4, totalCount: 5 },
      },
    ],
    overall: {
      average: 5.25,
      status: 'recovery',
      attendance: { rate: 80, presentCount: 4, totalCount: 5 },
      approvedSubjects: 1,
      totalSubjects: 2,
    },
    generatedAt: '2026-08-03T00:00:00.000Z',
    ...overrides,
  }
}

function mockReport(data: StudentReport | undefined) {
  mockUseStudentReport.mockReturnValue({ data, isLoading: false } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseStudent.mockReturnValue({ data: { id: 'stu-1', name: 'Maria Silva' } } as never)
  mockUseSchoolKey.mockReturnValue({ schoolKey: 'school-1', enabled: true } as never)
  mockUseSchool.mockReturnValue({ data: { id: 'school-1', name: 'Colégio Exemplo' } } as never)
})

describe('StudentReportPage', () => {
  it('renderiza situação final, médias e frequência por disciplina', () => {
    mockReport(makeReport())

    renderWithProviders(<StudentReportPage />)

    expect(screen.getByText('Boletim Escolar · Situação Final')).toBeInTheDocument()
    expect(screen.getByText('Matemática')).toBeInTheDocument()
    expect(screen.getByText('Português')).toBeInTheDocument()

    expect(screen.getByText('7.0')).toBeInTheDocument()
    expect(screen.getByText('3.5')).toBeInTheDocument()

    expect(screen.getAllByText('80%').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('1 de 2 disciplinas aprovada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Imprimir boletim' })).toBeInTheDocument()
  })

  it('exibe situação geral de recuperação quando há disciplina em recuperação', () => {
    mockReport(makeReport())

    renderWithProviders(<StudentReportPage />)

    const recoveryBadges = screen.getAllByText('Recuperação')
    expect(recoveryBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('exibe situação geral reprovada quando há disciplina reprovada', () => {
    mockReport(
      makeReport({
        subjects: [
          {
            subjectId: 'math',
            subjectName: 'Matemática',
            classId: 'class-1',
            className: '9º A',
            grades: [],
            average: 2,
            status: 'failed',
            attendance: { rate: 80, presentCount: 4, totalCount: 5 },
          },
        ],
        overall: {
          average: 2,
          status: 'failed',
          attendance: { rate: 80, presentCount: 4, totalCount: 5 },
          approvedSubjects: 0,
          totalSubjects: 1,
        },
      }),
    )

    renderWithProviders(<StudentReportPage />)

    expect(screen.getAllByText('Reprovado').length).toBeGreaterThanOrEqual(2)
  })

  it('mostra empty state quando o aluno não tem notas', () => {
    mockReport(makeReport({ subjects: [], periods: [], overall: { average: null, status: null, attendance: null, approvedSubjects: 0, totalSubjects: 0 } }))

    renderWithProviders(<StudentReportPage />)

    expect(screen.getByText('Sem notas registradas')).toBeInTheDocument()
    expect(screen.getByText('Sem notas registradas para este aluno.')).toBeInTheDocument()
  })
})
