import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractErrorMessage } from '../lib/errors'

interface UseApiMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  successMessage?: string | ((data: TData) => string)
  errorMessage?: string | ((err: unknown) => string)
  invalidate?: QueryKey[]
  onSuccess?: (data: TData) => void
  onError?: (err: unknown) => void
}

export function useApiMutation<TData, TVariables>({
  mutationFn,
  successMessage,
  errorMessage = 'Erro inesperado',
  invalidate,
  onSuccess,
  onError,
}: UseApiMutationOptions<TData, TVariables>) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (successMessage) {
        const msg = typeof successMessage === 'function' ? successMessage(data) : successMessage
        toast.success(msg)
      }
      if (invalidate) {
        invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }))
      }
      onSuccess?.(data)
    },
    onError: (err) => {
      const msg = typeof errorMessage === 'function' ? errorMessage(err) : extractErrorMessage(err, errorMessage)
      toast.error(msg)
      onError?.(err)
    },
  })
}
