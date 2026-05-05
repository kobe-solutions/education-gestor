export type UserRole = 'admin' | 'gestor' | 'professor' | 'secretaria'

export type AdminPayload = {
  userId: string
  role: 'admin'
}

export type SecretariaPayload = {
  userId: string
  secretariaId: string
  role: 'secretaria'
}

export type TenantPayload = {
  userId: string
  schoolId: string
  role: 'gestor' | 'professor'
}

export type JwtPayload = AdminPayload | SecretariaPayload | TenantPayload

export interface School {
  id: string
  name: string
  slug: string
  email: string
  createdAt: string
}

export interface Student {
  id: string
  schoolId: string
  name: string
  email: string | null
  birthDate: string | null
  enrollmentCode: string
  createdAt: string
  updatedAt: string
}

export interface Guardian {
  id: string
  studentId: string
  name: string
  email: string | null
  phone: string | null
  relationship: string
  createdAt: string
}

export interface Teacher {
  id: string
  schoolId: string
  name: string
  email: string
  role: 'professor'
  createdAt: string
  updatedAt: string
}

export interface SchoolClass {
  id: string
  schoolId: string
  name: string
  grade: string
  shift: string
  termTime: string
  teachers: { id: string; teacherId: string; classId: string }[]
  students: { id: string; studentId: string; classId: string }[]
  createdAt: string
  updatedAt: string
}

export interface AcademicPeriod {
  id: string
  schoolId: string
  name: string
  startDate: string
  endDate: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Grade {
  id: string
  classId: string
  studentId: string
  teacherId: string
  subject: string
  value: string
  period: string
  createdAt: string
}

export interface Attendance {
  id: string
  classId: string
  studentId: string
  date: string
  present: boolean
  createdAt: string
}

export interface Tuition {
  id: string
  schoolId: string
  studentId: string
  amount: string
  dueDate: string
  paidAt: string | null
  status: 'pending' | 'paid' | 'overdue'
  createdAt: string
  updatedAt: string
}

export interface Secretaria {
  id: string
  name: string
  email: string
  role: 'secretaria'
  createdAt: string
}
