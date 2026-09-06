import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../render'
import { DashboardPage } from '../../../pages/DashboardPage'
import { useDashboard, type DashboardData, type AdminDashboard, type SchoolDashboard } from '../../../features/dashboard/hooks/useDashboard'
import { useFinancialBlocked } from '../../../lib/useFinancialBlocked'

vi.mock('../../../features/dashboard/hooks/useDashboard', () => ({
  useDashboard: vi.fn(),
  isAdminDashboard: (data: DashboardData) => 'secretariasActive' in data,
}))

vi.mock('../../../lib/useFinancialBlocked', () => ({
  useFinancialBlocked: vi.fn(() => ({ blocked: false, loading: false })),
}))

const mockUseDashboard = vi.mocked(useDashboard)
const mockUseFinancialBlocked = vi.mocked(useFinancialBlocked)

function makeSchoolDashboard(): SchoolDashboard {
  return {
    studentsCount: 120,
    teachersCount: 15,
    classesCount: 8,
    tuitions: {
      total: { count: 9, total: '9000.00' },
      pending: { count: 3, total: '3000.00' },
      paid: { count: 5, total: '5000.00' },
      overdue: { count: 1, total: '1000.00' },
    },
    upcomingTuitions: [],
    attendanceRate: 92,
    academicPerformance: { average: '7.8', passRate: 88, totalGrades: 200 },
    classOccupancy: [
      {
        classId: 'cls-1',
        className: '1° Ano A',
        studentCount: 35,
        maxStudents: 40,
        attendanceRate: 94,
        registrationRate: 88,
        averageGrade: '7.2',
      },
      {
        classId: 'cls-2',
        className: '2° Ano B',
        studentCount: 30,
        maxStudents: 40,
        attendanceRate: null,
        registrationRate: null,
        averageGrade: null,
      },
    ],
    studentsByStatus: { active: 110, inactive: 5, transferred: 3, cancelled: 2 },
    teachersByStatus: { ativo: 13, inativo: 1, licenca: 1 },
    recentActivity: [],
    alerts: { lowAttendanceStudents: [], overdueTuitions: 1, studentsWithoutGuardians: [], studentsWithoutIdDocument: [] },
  }
}

function makeAdminDashboard(): AdminDashboard {
  return {
    secretariasCount: 4,
    secretariasActive: 3,
    schoolsCount: 12,
    studentsCount: 800,
    studentsByStatus: { active: 700, inactive: 50, transferred: 30, cancelled: 20 },
    teachersCount: 90,
    teachersByStatus: { ativo: 80, inativo: 5, licenca: 5 },
    classesCount: 40,
    tuitions: {
      total: { count: 85, total: '85000.00' },
      pending: { count: 20, total: '20000.00' },
      paid: { count: 60, total: '60000.00' },
      overdue: { count: 5, total: '5000.00' },
    },
    topSchools: [],
    recentActivity: [],
  }
}

function mockResult(data: DashboardData | undefined, isLoading: boolean) {
  return {
    data,
    isLoading,
  } as ReturnType<typeof useDashboard>
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseFinancialBlocked.mockReturnValue({ blocked: false, loading: false })
})

describe('DashboardPage', () => {
  it('gestor: renderiza o painel da escola', () => {
    mockUseDashboard.mockReturnValue(mockResult(makeSchoolDashboard(), false))

    renderWithProviders(<DashboardPage />, {
      initialRoute: '/',
      mockAuth: { payload: { userId: 'u1', name: 'Gestor', role: 'gestor', schoolId: 'school-1' } },
    })

    expect(screen.getByText('Painel')).toBeInTheDocument()
    expect(screen.getAllByText('Alunos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Professores').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Turmas').length).toBeGreaterThan(0)
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
  })

  it('admin: renderiza o painel administrativo', () => {
    mockUseDashboard.mockReturnValue(mockResult(makeAdminDashboard(), false))

    renderWithProviders(<DashboardPage />, {
      initialRoute: '/',
      mockAuth: { payload: { userId: 'u1', name: 'Admin', role: 'admin' } },
    })

    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument()
    expect(screen.getByText('Secretarias')).toBeInTheDocument()
    expect(screen.getByText('Escolas')).toBeInTheDocument()
  })

  it('secretaria sem escola ativa: mostra aviso de seleção', () => {
    mockUseDashboard.mockReturnValue(mockResult(undefined, false))

    renderWithProviders(<DashboardPage />, {
      initialRoute: '/',
      mockAuth: { payload: { userId: 'u1', secretariaId: 'sec-1', name: 'Sec', role: 'secretaria' } },
      mockSchool: { activeSchoolId: null },
    })

    expect(screen.getByText('Nenhuma escola selecionada')).toBeInTheDocument()
    expect(screen.getByText('Ir para Minhas Escolas')).toBeInTheDocument()
  })

  it('professor: redireciona para /professor', () => {
    mockUseDashboard.mockReturnValue(mockResult(makeSchoolDashboard(), false))

    renderWithProviders(<DashboardPage />, {
      initialRoute: '/',
      mockAuth: { payload: { userId: 'u1', name: 'Prof', role: 'professor', schoolId: 'school-1' } },
    })

    expect(screen.queryByText('Painel')).not.toBeInTheDocument()
    expect(screen.queryByText('Painel Administrativo')).not.toBeInTheDocument()
  })

  it('school dashboard: turmas renderiza 5 colunas e links de navegação', () => {
    mockUseDashboard.mockReturnValue(mockResult(makeSchoolDashboard(), false))

    renderWithProviders(<DashboardPage />, {
      initialRoute: '/',
      mockAuth: { payload: { userId: 'u1', name: 'Gestor', role: 'gestor', schoolId: 'school-1' } },
    })

    expect(screen.getByText('Nome')).toBeInTheDocument()
    expect(screen.getByText('Qtd. alunos')).toBeInTheDocument()
    expect(screen.getByText('Frequência')).toBeInTheDocument()
    expect(screen.getByText('Aulas registradas')).toBeInTheDocument()
    expect(screen.getAllByText('Média geral').length).toBeGreaterThanOrEqual(1)

    const classLink = screen.getByText('1° Ano A')
    expect(classLink.closest('a')).toHaveAttribute('href', '/classes/cls-1')

    expect(screen.getAllByText('94%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('88%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('7.2')).toBeInTheDocument()

    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('school dashboard: não renderiza upcomingTuitions no painel', () => {
    const data = makeSchoolDashboard()
    data.upcomingTuitions = [
      { id: 't1', studentId: 's1', studentName: 'João Silva', amount: '500.00', dueDate: '2026-02-10', status: 'pending' },
      { id: 't2', studentId: 's2', studentName: 'Maria Santos', amount: '500.00', dueDate: '2026-02-15', status: 'overdue' },
    ]
    mockUseDashboard.mockReturnValue(mockResult(data, false))

    renderWithProviders(<DashboardPage />, {
      initialRoute: '/',
      mockAuth: { payload: { userId: 'u1', name: 'Gestor', role: 'gestor', schoolId: 'school-1' } },
    })

    expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
    expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
  })

  it('school dashboard: renderiza Controle de Demandas com cards de alerta', () => {
    const data = makeSchoolDashboard()
    data.alerts = {
      lowAttendanceStudents: [{ studentId: 's1', studentName: 'Pedro', absenceCount: 5 }],
      overdueTuitions: 2,
      studentsWithoutGuardians: [{ studentId: 's2', studentName: 'Ana' }],
      studentsWithoutIdDocument: [],
    }
    mockUseDashboard.mockReturnValue(mockResult(data, false))

    renderWithProviders(<DashboardPage />, {
      initialRoute: '/',
      mockAuth: { payload: { userId: 'u1', name: 'Gestor', role: 'gestor', schoolId: 'school-1' } },
    })

    expect(screen.getByText('Controle de Demandas')).toBeInTheDocument()
    expect(screen.getByText('Mensalidades atrasadas')).toBeInTheDocument()
    expect(screen.getByText('Sem responsável')).toBeInTheDocument()
  })
})
