import axios from 'axios'
import { toast } from 'sonner'
import { queryClient } from './queryClient'
import { extractErrorMessage } from './errors'

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const activeSchoolId = sessionStorage.getItem('activeSchoolId')
  if (activeSchoolId) {
    config.headers['X-School-Id'] = activeSchoolId
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem('token')
      sessionStorage.clear()
      queryClient.clear()
      window.location.href = '/login'
      return new Promise(() => {})
    }

    if (status === 403) {
      toast.error(extractErrorMessage(error, 'Acesso negado. Você não tem permissão para esta ação.'))
    } else if (status && status >= 500) {
      toast.error(extractErrorMessage(error, 'Erro interno do servidor. Tente novamente mais tarde.'))
    } else if (status && status >= 400 && status < 500) {
      const msg = extractErrorMessage(error)
      if (msg) toast.error(msg)
    }

    return Promise.reject(error)
  },
)
