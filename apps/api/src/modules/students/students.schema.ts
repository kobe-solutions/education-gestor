import { z } from 'zod'

export const ENROLLMENT_STATUSES = ['active', 'inactive', 'transferred', 'cancelled'] as const
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
export const SEX_OPTIONS = ['M', 'F', 'outro'] as const
export const DOCUMENT_TYPES = ['historico', 'boletim', 'identidade', 'outros'] as const

export const createStudentBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().date().optional(),
  sex: z.enum(SEX_OPTIONS).optional(),
  bloodType: z.enum(BLOOD_TYPES).optional(),
  naturalidade: z.string().optional(),
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
  enrollmentDate: z.string().date().optional(),
  internalCode: z.string().optional(),
})

export const updateStudentBodySchema = createStudentBodySchema.partial().extend({
  enrollmentStatus: z.enum(ENROLLMENT_STATUSES).optional(),
})

export const upsertMedicalBodySchema = z.object({
  allergies: z.string().optional(),
  medications: z.string().optional(),
  foodRestrictions: z.string().optional(),
  diseases: z.string().optional(),
  medicalContact: z.string().optional(),
})

export const createGuardianBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  profession: z.string().optional(),
  relationship: z.string().min(2),
  isResponsible: z.boolean().default(false),
  isAuthorizedPickup: z.boolean().default(false),
})

export const updateGuardianBodySchema = createGuardianBodySchema.partial()

export type CreateStudentBody = z.infer<typeof createStudentBodySchema>
export type UpdateStudentBody = z.infer<typeof updateStudentBodySchema>
export type UpsertMedicalBody = z.infer<typeof upsertMedicalBodySchema>
export type CreateGuardianBody = z.infer<typeof createGuardianBodySchema>
