import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import { useTuitions, useRegisterPayment } from '../../../features/financial/hooks/useFinancial'

vi.mock('../../../lib/useSchoolKey', () => ({
  useSchoolKey: vi.fn(() => ({ schoolKey: 'school-1', enabled: true })),
}))

const mockGet = vi.mocked(api.get)
const mockPatch = vi.mocked(api.patch)
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

describe('useTuitions', () => {
  it('chama GET /tuitions com page/limit e status quando informado', async () => {
    mockGet.mockResolvedValue(axiosRes({ data: [{ id: 't-1' }], total: 1 }))

    const { queryClient, Wrapper } = createWrapper()
    const { result } = renderHook(() => useTuitions({ page: 1, limit: 15, status: 'pending' }), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGet).toHaveBeenCalledWith(
      '/tuitions',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, limit: 15, status: 'pending' }),
      }),
    )
    expect(result.current.data?.total).toBe(1)
    expect(queryClient.getQueryData(['tuitions', 'school-1', { page: 1, limit: 15, status: 'pending' }])).toBeDefined()
  })

  it('omite status=all (sem filtro) dos params', async () => {
    mockGet.mockResolvedValue(axiosRes({ data: [], total: 0 }))

    const { Wrapper } = createWrapper()
    renderHook(() => useTuitions({ page: 1, limit: 15, status: 'all' }), { wrapper: Wrapper })

    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    expect(mockGet).toHaveBeenCalledWith(
      '/tuitions',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, limit: 15 }),
      }),
    )
  })
})

describe('useRegisterPayment', () => {
  it('chama PATCH para registrar pagamento', async () => {
    mockPatch.mockResolvedValue(axiosRes({ id: 't-1', studentId: 'stu-1', status: 'paid' }))

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useRegisterPayment(), { wrapper: Wrapper })

    await result.current.mutateAsync('t-1')

    expect(mockPatch).toHaveBeenCalledWith('/tuitions/t-1/pay')
  })
})
