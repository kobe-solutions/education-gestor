import { type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { AuthContext } from '../contexts/AuthContext'
import { SchoolContext } from '../contexts/SchoolContext'
import { FinancialVisibilityProvider } from '../contexts/FinancialVisibilityContext'
import { api } from '../lib/api'
import type { JwtPayload } from '@education-gestor/types'

type ApiMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** Retorno esperado de um mock de `api[method]` — `{ data: body }` (axios). */
export interface MockApiHandler {
  (url: string, config?: Record<string, unknown>): Promise<{ data: unknown }>
}

export interface MockApi {
  get?: MockApiHandler
  post?: MockApiHandler
  put?: MockApiHandler
  patch?: MockApiHandler
  delete?: MockApiHandler
}

export interface MockAuth {
  token?: string | null
  payload?: JwtPayload | null
  login?: () => void
  logout?: () => void
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string
  /** Define retornos para os métodos do `api` (mocado globalmente no `setup.ts`). */
  mockApi?: MockApi
  /** Injeta um AuthContext com token/payload determinados. */
  mockAuth?: MockAuth
  /** Injeta um SchoolContext com escola ativa determinada. */
  mockSchool?: { activeSchoolId?: string | null; activeSchoolName?: string | null }
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

const NOOP = () => {}

/** Aplica os mocks de `api[method]` descritos em `mockApi` (mocados no `setup.ts`). */
export function applyMockApi(mockApi?: MockApi) {
  if (mockApi) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const handler = mockApi[method]
      if (handler) {
        vi.mocked(api[method]).mockImplementation(handler as never)
      }
    }
  }
}

export interface ProvidersOptions {
  initialRoute?: string
  mockApi?: MockApi
  mockAuth?: MockAuth
  mockSchool?: RenderWithProvidersOptions['mockSchool']
}

/** Cria um componente Wrapper com todos os providers. Reutilizável com `render` e `renderHook`. */
export function createProviders(options: ProvidersOptions = {}) {
  const { initialRoute = '/', mockApi, mockAuth, mockSchool } = options
  const queryClient = createTestQueryClient()

  applyMockApi(mockApi)

  const authValue = {
    token: mockAuth?.token ?? null,
    payload: mockAuth?.payload ?? null,
    login: mockAuth?.login ?? NOOP,
    logout: mockAuth?.logout ?? NOOP,
  }

  const schoolValue = {
    activeSchoolId: mockSchool?.activeSchoolId ?? null,
    activeSchoolName: mockSchool?.activeSchoolName ?? null,
    setActiveSchool: NOOP,
    clearActiveSchool: NOOP,
  }

  function Providers({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={authValue}>
        <SchoolContext.Provider value={schoolValue}>
          <FinancialVisibilityProvider>
            <QueryClientProvider client={queryClient}>
              <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
            </QueryClientProvider>
          </FinancialVisibilityProvider>
        </SchoolContext.Provider>
      </AuthContext.Provider>
    )
  }

  return { Providers, queryClient }
}

export function renderWithProviders(ui: ReactNode, options: RenderWithProvidersOptions = {}) {
  const { initialRoute = '/', mockApi, mockAuth, mockSchool, ...renderOptions } = options
  const { Providers, queryClient } = createProviders({ initialRoute, mockApi, mockAuth, mockSchool })

  return {
    ...render(ui, { wrapper: Providers, ...renderOptions }),
    queryClient,
  }
}
