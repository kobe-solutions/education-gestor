import { z } from 'zod'

export const importStudentRowSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  birthDate: z.string().date('Data de nascimento inválida (use YYYY-MM-DD)'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  sex: z.enum(['M', 'F', 'outro']).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  naturalidade: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  motherName: z.string().optional(),
  fatherName: z.string().optional(),
  motherPhone: z.string().optional(),
  addressCep: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  comorbidities: z.string().optional(),
  observations: z.string().optional(),
  internalCode: z.string().optional(),
  enrollmentDate: z.string().date('Data de matrícula inválida (use YYYY-MM-DD)').optional(),
  enrollmentStatus: z.enum(['active', 'inactive', 'transferred', 'cancelled']).optional(),
})

export type ImportStudentRow = z.infer<typeof importStudentRowSchema>

export type ImportResultRow = {
  row: number
  status: 'success' | 'error'
  message?: string
  studentId?: string
}

export type ImportResult = {
  totalRows: number
  imported: number
  errors: number
  details: ImportResultRow[]
}