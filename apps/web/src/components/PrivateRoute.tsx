import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import { canAccessRoute, SECRETARIA_PUBLIC_PATHS } from '../lib/routes'
import type { UserRole } from '@education-gestor/types'

interface PrivateRouteProps {
  allowedRoles?: UserRole[]
  requireSchool?: boolean
}

export function PrivateRoute({ allowedRoles, requireSchool }: PrivateRouteProps) {
  const { token, payload } = useAuth()
  const { activeSchoolId } = useSchoolContext()
  const location = useLocation()

  if (!token || !payload) {
    return <Navigate to="/login" replace />
  }

  const role = payload.role as UserRole
  const allowedByRoute = canAccessRoute(role, location.pathname)

  if (!allowedByRoute || (allowedRoles && !allowedRoles.includes(role))) {
    const destination = payload.role === 'professor' ? '/professor' : payload.role === 'admin' ? '/admin' : '/'
    return <Navigate to={destination} replace state={{ accessDenied: true }} />
  }

  // Secretaria sem escola selecionada tentando acessar rota que precisa de escola
  const isSecretariaPublicPath = SECRETARIA_PUBLIC_PATHS.some((path) =>
    path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`),
  )
  const needsSchool = requireSchool !== false &&
    payload.role === 'secretaria' &&
    !activeSchoolId &&
    !isSecretariaPublicPath

  if (needsSchool) {
    return <Navigate to="/my-schools" replace state={{ requiresSchoolSelection: true }} />
  }

  return <Outlet />
}
