export type UserRole = 'admin' | 'gestor' | 'professor' | 'secretaria'

export type AdminPayload = {
  userId: string
  name: string
  role: 'admin'
}

export type SecretariaPayload = {
  userId: string
  secretariaId: string
  name: string
  role: 'secretaria'
}

export type TenantPayload = {
  userId: string
  schoolId: string
  name: string
  role: 'gestor' | 'professor'
}

export type JwtPayload = AdminPayload | SecretariaPayload | TenantPayload

export interface School {
  id: string
  name: string
  slug: string
  email: string
  director: string | null
  coordinator: string | null
  phone: string | null
  address: string | null
  createdAt: string
}

export interface Subject {
  id: string
  schoolId: string
  name: string
  code: string | null
  weeklyHours: number
  createdAt: string
}

export type EnrollmentStatus = 'active' | 'inactive' | 'transferred' | 'cancelled'
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type Sex = 'M' | 'F' | 'outro'
export type DocumentType = 'historico' | 'boletim' | 'identidade' | 'outros'

export interface Student {
  id: string
  schoolId: string
  name: string
  email: string | null
  cpf: string | null
  rg: string | null
  birthDate: string | null
  sex: Sex | null
  bloodType: BloodType | null
  naturalidade: string | null
  photoUrl: string | null
  phone: string | null
  motherName: string | null
  fatherName: string | null
  motherPhone: string | null
  addressCep: string | null
  addressStreet: string | null
  addressNumber: string | null
  addressComplement: string | null
  addressNeighborhood: string | null
  addressCity: string | null
  addressState: string | null
  comorbidities: string | null
  observations: string | null
  enrollmentCode: string
  internalCode: string | null
  enrollmentStatus: EnrollmentStatus
  enrollmentDate: string | null
  createdAt: string
  updatedAt: string
}

export interface Guardian {
  id: string
  studentId: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  profession: string | null
  relationship: string
  isResponsible: boolean
  isAuthorizedPickup: boolean
  createdAt: string
}

export interface StudentMedical {
  id: string
  studentId: string
  allergies: string | null
  medications: string | null
  foodRestrictions: string | null
  diseases: string | null
  medicalContact: string | null
  createdAt: string
  updatedAt: string
}

export interface StudentDocument {
  id: string
  studentId: string
  name: string
  type: DocumentType
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  createdAt: string
}

export type ContractType = 'clt' | 'temporario' | 'horista'
export type WorkShift = 'matutino' | 'vespertino' | 'noturno' | 'integral'
export type EmploymentStatus = 'ativo' | 'inativo' | 'licenca'

export interface Teacher {
  id: string
  schoolId: string
  name: string
  email: string
  role: 'professor'
  cpf: string | null
  rg: string | null
  birthDate: string | null
  sex: Sex | null
  nationality: string | null
  maritalStatus: string | null
  photoUrl: string | null
  phone: string | null
  addressCep: string | null
  addressStreet: string | null
  addressNumber: string | null
  addressComplement: string | null
  addressNeighborhood: string | null
  addressCity: string | null
  addressState: string | null
  position: string | null
  contractType: ContractType | null
  workload: string | null
  workShift: WorkShift | null
  employmentStatus: EmploymentStatus
  educationLevel: string | null
  degree: string | null
  institution: string | null
  professionalRegistry: string | null
  bank: string | null
  agency: string | null
  accountNumber: string | null
  accountType: string | null
  pixKey: string | null
  createdAt: string
  updatedAt: string
}

export interface SchoolClass {
  id: string
  schoolId: string
  name: string
  shift: string
  serieId: string | null
  academicPeriodId: string | null
  maxStudents: number
  studentCount?: number
  serie: { id: string; name: string; educationLevel: { id: string; name: string; type: string } | null } | null
  academicPeriod: { id: string; name: string } | null
  teachers: { id: string; name: string; email: string; role: string }[]
  students: { id: string; name: string; enrollmentCode: string }[]
  createdAt: string
  updatedAt: string
}

export interface AcademicYear {
  id: string
  schoolId: string
  year: number
  name: string
  startDate: string
  endDate: string
  registrationStart: string | null
  registrationEnd: string | null
  status: 'planning' | 'active' | 'closed'
  createdAt: string
  updatedAt: string
}

export type PeriodType = 'bimestre' | 'trimestre' | 'semestre'

export interface AcademicPeriod {
  id: string
  schoolId: string
  academicYearId: string
  name: string
  type: PeriodType
  order: number
  startDate: string
  endDate: string
  gradeClosingDate: string | null
  createdAt: string
  updatedAt: string
}

export interface Grade {
  id: string
  classId: string
  studentId: string
  teacherId: string
  subjectId: string
  academicPeriodId: string
  value: string
  subject: { id: string; name: string } | null
  academicPeriod: { id: string; name: string } | null
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
  phone: string | null
  address: string | null
  responsible: string | null
  active: boolean
  role: 'secretaria'
  createdAt: string
}
