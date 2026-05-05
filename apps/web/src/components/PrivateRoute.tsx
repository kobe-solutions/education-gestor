import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '@education-gestor/types'

interface PrivateRouteProps {
  allowedRoles?: UserRole[]
}

export function PrivateRoute({ allowedRoles }: PrivateRouteProps) {
  const { token, payload } = useAuth()

  if (!token || !payload) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(payload.role as UserRole)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
