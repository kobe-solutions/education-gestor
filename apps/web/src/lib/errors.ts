import type { AxiosError } from 'axios'
import type { ApiErrorResponse } from './api'

export function extractErrorMessage(err: unknown, fallback = 'Erro inesperado') {
  const responseData = (err as AxiosError<ApiErrorResponse & { message?: string }>)?.response?.data
  return responseData?.message ?? responseData?.error ?? fallback
}
