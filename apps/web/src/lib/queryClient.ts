import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
})

// Prefixos de queries de catálogo (mudam pouco) — persistidos para carga offline/troca de aba.
// Dados sensíveis por tenant (alunos, mensalidades, etc.) ficam fora do cache persistido.
const PERSIST_PREFIXES = ['subjects', 'education-levels', 'series', 'timetable-slots']

const persister = createAsyncStoragePersister({
  key: 'iris-react-query',
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 60 * 60 * 1000, // 1h
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      const first = query.queryKey[0]
      return typeof first === 'string' && PERSIST_PREFIXES.includes(first)
    },
  },
})
