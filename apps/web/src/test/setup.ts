import '@testing-library/jest-dom'
import { vi } from 'vitest'

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
