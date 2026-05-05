import { useMutation } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { useAuth } from '../../../contexts/AuthContext'

interface LoginInput {
  email: string
  password: string
}

export function useLogin() {
  const { login } = useAuth()

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await api.post<{ token: string }>('/sessions', data)
      return res.data
    },
    onSuccess: ({ token }) => {
      login(token)
    },
  })
}
