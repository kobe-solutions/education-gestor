import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import type { UserRole } from '@education-gestor/types'

interface PrivateRouteProps {
  allowedRoles?: UserRole[]
  requireSchool?: boolean
}

// Rotas que não redirecionam secretaria sem escola selecionada
const SECRETARIA_PUBLIC_PATHS = ['/', '/my-schools', '/escolas', '/secretarias']

export function PrivateRoute({ allowedRoles, requireSchool }: PrivateRouteProps) {
  const { token, payload } = useAuth()
  const { activeSchoolId } = useSchoolContext()
  const location = useLocation()

  if (!token || !payload) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(payload.role as UserRole)) {
    return <Navigate to="/" replace />
  }

  // Secretaria sem escola selecionada tentando acessar rota que precisa de escola
  const needsSchool = requireSchool !== false &&
    payload.role === 'secretaria' &&
    !activeSchoolId &&
    !SECRETARIA_PUBLIC_PATHS.some((p) => location.pathname.startsWith(p))

  if (needsSchool) {
    return <Navigate to="/my-schools" replace />
  }

  return <Outlet />
}
