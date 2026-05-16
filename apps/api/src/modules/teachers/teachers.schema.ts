import { z } from 'zod'

export const CONTRACT_TYPES = ['clt', 'temporario', 'horista'] as const
export const WORK_SHIFTS = ['matutino', 'vespertino', 'noturno', 'integral'] as const
export const EMPLOYMENT_STATUSES = ['ativo', 'inativo', 'licenca'] as const
export const SEX_OPTIONS = ['M', 'F', 'outro'] as const

export const userRoleSchema = z.enum(['gestor', 'professor'])

export const createTeacherBodySchema = z.object({
  // Obrigatórios
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  // Identificação pessoal
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().date().optional(),
  sex: z.enum(SEX_OPTIONS).optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  // Contato
  phone: z.string().optional(),
  // Endereço
  addressCep: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  // Dados profissionais
  position: z.string().optional(),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  workload: z.string().optional(),
  workShift: z.enum(WORK_SHIFTS).optional(),
  // Formação acadêmica
  educationLevel: z.string().optional(),
  degree: z.string().optional(),
  institution: z.string().optional(),
  professionalRegistry: z.string().optional(),
  // Dados financeiros
  bank: z.string().optional(),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),
  accountType: z.string().optional(),
  pixKey: z.string().optional(),
})

export const updateTeacherBodySchema = createTeacherBodySchema
  .omit({ password: true })
  .partial()
  .extend({
    employmentStatus: z.enum(EMPLOYMENT_STATUSES).optional(),
  })

export const loginTeacherBodySchema = z.object({
  schoolId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
})

export const changePasswordBodySchema = z.object({
  password: z.string().min(8),
})

export type CreateTeacherBody = z.infer<typeof createTeacherBodySchema>
export type UpdateTeacherBody = z.infer<typeof updateTeacherBodySchema>
export type LoginTeacherBody = z.infer<typeof loginTeacherBodySchema>
