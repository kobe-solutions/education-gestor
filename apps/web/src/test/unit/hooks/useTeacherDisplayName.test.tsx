import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useTeacherDisplayName } from '../../../features/teacher-dashboard/hooks/useTeacherDashboard'

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockGet = vi.mocked(api.get)
const mockUseAuth = vi.mocked(useAuth)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return { Wrapper }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTeacherDisplayName', () => {
  it('prioriza o nome atualizado do perfil do professor sobre o payload do JWT', async () => {
    mockUseAuth.mockReturnValue({
      token: 'tok',
      payload: { userId: 'teacher-1', schoolId: 'school-1', name: 'Nome Antigo', role: 'professor' },
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockGet.mockResolvedValue({ data: { data: { id: 'teacher-1', name: 'Nome Atualizado' } } } as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTeacherDisplayName(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current).toBe('Nome Atualizado'))
  })

  it('usa o nome do JWT como fallback enquanto o perfil não carrega', () => {
    mockUseAuth.mockReturnValue({
      token: 'tok',
      payload: { userId: 'teacher-1', schoolId: 'school-1', name: 'Nome JWT', role: 'professor' },
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockGet.mockReturnValue(new Promise(() => {}) as never)

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useTeacherDisplayName(), { wrapper: Wrapper })

    expect(result.current).toBe('Nome JWT')
  })
})
