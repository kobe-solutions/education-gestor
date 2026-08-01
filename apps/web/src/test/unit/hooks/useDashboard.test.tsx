import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import { useDashboard, isAdminDashboard } from '../../../features/dashboard/hooks/useDashboard'

vi.mock('../../../lib/useSchoolKey', () => ({
  useSchoolKey: vi.fn(() => ({ schoolKey: 'school-1', enabled: true })),
}))

const mockGet = vi.mocked(api.get)
const mockUseSchoolKey = vi.mocked(useSchoolKey)

function axiosRes(body: unknown) {
  return { data: body } as unknown as Awaited<ReturnType<typeof api.get>>
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return { queryClient, Wrapper }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSchoolKey.mockReturnValue({ schoolKey: 'school-1', enabled: true })
})

describe('useDashboard', () => {
  it('chama GET /dashboard e inclui schoolKey no queryKey', async () => {
    const schoolData = {
      studentsCount: 10,
      teachersCount: 3,
      classesCount: 2,
      tuitions: { pending: { count: 1, total: '100' }, paid: { count: 2, total: '200' }, overdue: { count: 0, total: '0' } },
      upcomingTuitions: [],
      attendanceRate: 90,
      academicPerformance: { average: '7.5', passRate: 80, totalGrades: 20 },
      classOccupancy: [],
      studentsByStatus: { active: 8, inactive: 1, transferred: 1, cancelled: 0 },
      teachersByStatus: { ativo: 3, inativo: 0, licenca: 0 },
      recentActivity: [],
      alerts: { lowAttendanceStudents: [], overdueTuitions: 0, studentsWithoutGuardians: [], studentsWithoutIdDocument: [] },
    }
    mockGet.mockResolvedValue(axiosRes(schoolData))

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useDashboard(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGet).toHaveBeenCalledWith('/dashboard')
    expect(result.current.data?.studentsCount).toBe(10)
    expect(queryClient.getQueryData(['dashboard', 'school-1'])).toBeDefined()
    expect(isAdminDashboard(result.current.data!)).toBe(false)
  })

  it('não dispara a query quando desabilitado', async () => {
    mockUseSchoolKey.mockReturnValue({ schoolKey: null, enabled: false })
    mockGet.mockResolvedValue(axiosRes({}))

    const { Wrapper } = createWrapper()
    renderHook(() => useDashboard(), { wrapper: Wrapper })

    await new Promise((r) => setTimeout(r, 0))
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('distingue dashboard admin via isAdminDashboard', () => {
    const adminData = {
      secretariasCount: 2,
      secretariasActive: 1,
      schoolsCount: 3,
      studentsCount: 50,
      studentsByStatus: { active: 40, inactive: 5, transferred: 3, cancelled: 2 },
      teachersCount: 12,
      teachersByStatus: { ativo: 10, inativo: 1, licenca: 1 },
      classesCount: 8,
      tuitions: { pending: { count: 1, total: '100' }, paid: { count: 2, total: '200' }, overdue: { count: 0, total: '0' } },
      topSchools: [],
      recentActivity: [],
    }
    expect(isAdminDashboard(adminData as never)).toBe(true)
  })
})
