import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock matchMedia para componentes que usam media queries (ex: dark mode, responsividade)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver para componentes que usam lazy loading / infinite scroll
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

// Mock do api client — cada teste configura os retornos via vi.mocked()
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock do react-router para não precisar de BrowserRouter nos testes unitários
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  const React = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
      React.createElement('a', { href: to }, children),
  }
})
