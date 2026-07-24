import type { AxiosError } from 'axios'

export function extractErrorMessage(err: unknown, fallback = 'Erro inesperado') {
  return (err as AxiosError<{ message: string }>)?.response?.data?.message ?? fallback
}
