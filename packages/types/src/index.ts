export type UserRole = 'admin' | 'teacher' | 'secretary'

export interface JwtPayload {
  userId: string
  schoolId: string
  role: UserRole
}
