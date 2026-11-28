import type { UserRole } from '@education-gestor/types'

const ALL_ROLES: UserRole[] = ['admin', 'secretaria', 'gestor', 'professor']
const SCHOOL_OPERATORS: UserRole[] = ['gestor', 'secretaria']

/** Routes that a Secretaria can access before choosing an active school. */
export const SECRETARIA_PUBLIC_PATHS = ['/', '/my-schools', '/schools-hub', '/schools']

/**
 * Canonical UI permissions. Static routes use their literal pathname; paths
 * with an identifier are resolved in `getRouteRoles` below.
 */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/': ALL_ROLES,
  '/admin': ['admin'],
  '/admin/activity': ['admin'],
  '/secretarias': ['admin'],
  '/schools': ['admin', 'secretaria'],
  '/schools-hub': ['secretaria'],
  '/my-schools': ['secretaria'],
  '/people': SCHOOL_OPERATORS,
  '/students': SCHOOL_OPERATORS,
  '/teachers': SCHOOL_OPERATORS,
  '/structure/classes': ['gestor'],
  '/classes': ['gestor'],
  '/academic': ['gestor', 'secretaria', 'professor'],
  '/academic-years': SCHOOL_OPERATORS,
  '/academic-periods': ['gestor'],
  '/subjects': ['gestor'],
  '/education-levels': ['gestor'],
  '/series': ['gestor'],
  '/class-periods': ['gestor'],
  '/scheduling': SCHOOL_OPERATORS,
  '/scheduling/students': SCHOOL_OPERATORS,
  '/grades': SCHOOL_OPERATORS,
  '/attendance': SCHOOL_OPERATORS,
  '/dashboard/registration-status': SCHOOL_OPERATORS,
  '/financial': SCHOOL_OPERATORS,
  '/financial-control': SCHOOL_OPERATORS,
  '/school-events': ['gestor', 'secretaria', 'professor'],
  '/lesson-records': ['gestor', 'professor'],
  '/settings': ['gestor'],
  '/professor': ['professor'],
}

export function getRouteRoles(pathname: string): UserRole[] | undefined {
  const exact = ROUTE_ROLES[pathname]
  if (exact) return exact

  if (/^\/students\/[^/]+(?:\/(?:edit|report))?$/.test(pathname)) return SCHOOL_OPERATORS
  if (/^\/teachers\/(?:new|[^/]+\/edit)$/.test(pathname)) return SCHOOL_OPERATORS
  if (/^\/education-levels\/[^/]+\/series$/.test(pathname)) return ['gestor']
  if (/^\/classes\/[^/]+(?:\/timetable)?$/.test(pathname)) return ['gestor', 'secretaria', 'professor']
  if (pathname.startsWith('/professor/')) return ['professor']

  return undefined
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const allowedRoles = getRouteRoles(pathname)
  return !allowedRoles || allowedRoles.includes(role)
}
