import type { UserRole } from '@education-gestor/types'

export const SECRETARIA_PUBLIC_PATHS = ['/', '/my-schools', '/schools-hub', '/secretarias']

export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/admin/activity': ['admin'],
  '/secretarias': ['admin'],
  '/schools': ['admin', 'secretaria'],
  '/schools-hub': ['secretaria'],
  '/my-schools': ['secretaria'],
  '/students': ['gestor', 'secretaria'],
  '/teachers': ['gestor', 'secretaria'],
  '/classes': ['gestor', 'professor', 'secretaria'],
  '/financial': ['gestor', 'secretaria'],
  '/academic': ['gestor', 'professor', 'secretaria'],
  '/scheduling': ['gestor', 'secretaria'],
  '/structure': ['gestor'],
  '/settings': ['gestor'],
  '/professor': ['professor'],
}
