import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'

export interface ActivityItem {
  id: string
  userId: string
  userRole: string
  action: string
  entity: string
  entityId: string
  createdAt: string
}

interface ActivityResponse {
  total: number
  items: ActivityItem[]
}

interface ActivityFilters {
  action?: string
  entity?: string
  limit?: number
  offset?: number
}

export function useAdminActivity(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: ['admin-activity', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.action) params.set('action', filters.action)
      if (filters.entity) params.set('entity', filters.entity)
      if (filters.limit) params.set('limit', String(filters.limit))
      if (filters.offset) params.set('offset', String(filters.offset))

      const res = await api.get<ActivityResponse>(`/admin/activity?${params.toString()}`)
      return res.data
    },
  })
}
