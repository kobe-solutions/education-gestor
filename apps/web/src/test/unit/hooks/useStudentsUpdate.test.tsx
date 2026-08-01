import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useUpdateStudent, useDeleteStudent } from '../../../features/students/hooks/useStudents'

const mockPut = vi.mocked(api.put)
const mockDelete = vi.mocked(api.delete)

function axiosRes(body: unknown) {
  return { data: body } as unknown as Awaited<ReturnType<typeof api.put>>
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
})

describe('useUpdateStudent', () => {
  it('chama PUT /students/:id e invalida lista + detalhe', async () => {
    mockPut.mockResolvedValue(axiosRes({ id: 'stu-1', name: 'Maria' }))

    const { queryClient, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateStudent('stu-1'), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync({ name: 'Maria Atualizada' })
    })

    expect(mockPut).toHaveBeenCalledWith('/students/stu-1', { name: 'Maria Atualizada' })
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['students'] }))
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['students', 'stu-1'] }))
  })
})

describe('useDeleteStudent', () => {
  it('chama DELETE /students/:id e invalida a lista', async () => {
    mockDelete.mockResolvedValue(undefined as never)

    const { queryClient, Wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteStudent(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.mutateAsync('stu-9')
    })

    expect(mockDelete).toHaveBeenCalledWith('/students/stu-9')
    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['students'] }))
  })
})
