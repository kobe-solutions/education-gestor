import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import { useStudents, useCreateStudent } from '../../../features/students/hooks/useStudents'

vi.mock('../../../lib/useSchoolKey', () => ({
  useSchoolKey: vi.fn(() => ({ schoolKey: 'school-1', enabled: true })),
}))

const mockGet = vi.mocked(api.get)
const mockPost = vi.mocked(api.post)
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

describe('useStudents', () => {
  it('chama GET /students com page/limit e inclui schoolKey no queryKey', async () => {
    mockGet.mockResolvedValue(axiosRes({ data: [{ id: 'stu-1' }], total: 1 }))

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useStudents({ page: 2, limit: 15 }), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGet).toHaveBeenCalledWith(
      '/students',
      expect.objectContaining({
        params: expect.objectContaining({ page: 2, limit: 15 }),
      }),
    )
    expect(result.current.data?.total).toBe(1)
    expect(queryClient.getQueryData(['students', 'school-1', { page: 2, limit: 15 }])).toBeDefined()
  })

  it('envia status/sex/filtros de idade quando informados', async () => {
    mockGet.mockResolvedValue(axiosRes({ data: [], total: 0 }))

    const { Wrapper } = createWrapper()
    renderHook(() => useStudents({ page: 1, limit: 50, search: 'maria', status: 'active', minAge: 5, maxAge: 17 }), { wrapper: Wrapper })

    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    expect(mockGet).toHaveBeenCalledWith(
      '/students',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'maria', status: 'active', minAge: 5, maxAge: 17 }),
      }),
    )
  })

  it('não dispara a query quando desabilitado (ex: secretaria sem escola ativa)', async () => {
    mockUseSchoolKey.mockReturnValue({ schoolKey: null, enabled: false })
    mockGet.mockResolvedValue(axiosRes({ data: [], total: 0 }))

    const { Wrapper } = createWrapper()
    renderHook(() => useStudents({ page: 1, limit: 50 }), { wrapper: Wrapper })

    await new Promise((r) => setTimeout(r, 0))
    expect(mockGet).not.toHaveBeenCalled()
  })
})

describe('useCreateStudent', () => {
  it('invalida queries de students após criar', async () => {
    mockPost.mockResolvedValue(axiosRes({ id: 'stu-new' }))

    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }

    const { result } = renderHook(() => useCreateStudent(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ name: 'Maria Silva' })
    })

    expect(mockPost).toHaveBeenCalledWith('/students', { name: 'Maria Silva' })
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['students'] }))
  })
})
