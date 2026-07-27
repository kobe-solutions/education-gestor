import axios from 'axios'
import { toast } from 'sonner'
import { queryClient } from './queryClient'

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
    const data = error.response?.data
    const message = data?.message

    if (status === 401) {
      localStorage.removeItem('token')
      sessionStorage.clear()
      queryClient.clear()
      window.location.href = '/login'
      return new Promise(() => {})
    }

    if (status === 403) {
      toast.error(message ?? 'Acesso negado. Você não tem permissão para esta ação.')
    } else if (status && status >= 500) {
      toast.error(message ?? 'Erro interno do servidor. Tente novamente mais tarde.')
    }

    return Promise.reject(error)
  },
)
