import { pgTable, uuid, text, timestamp, date, boolean } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  // Identificação
  name: text('name').notNull(),
  email: text('email'),
  cpf: text('cpf'),
  rg: text('rg'),
  birthDate: date('birth_date'),
  sex: text('sex'),
  bloodType: text('blood_type'),
  naturalidade: text('naturalidade'),
  photoUrl: text('photo_url'),
  // Contato
  phone: text('phone'),
  // Família
  motherName: text('mother_name'),
  fatherName: text('father_name'),
  motherPhone: text('mother_phone'),
  // Endereço
  addressCep: text('address_cep'),
  addressStreet: text('address_street'),
  addressNumber: text('address_number'),
  addressComplement: text('address_complement'),
  addressNeighborhood: text('address_neighborhood'),
  addressCity: text('address_city'),
  addressState: text('address_state'),
  // Saúde e observações
  comorbidities: text('comorbidities'),
  observations: text('observations'),
  // Matrícula
  enrollmentCode: text('enrollment_code').notNull(),
  internalCode: text('internal_code'),
  enrollmentStatus: text('enrollment_status').notNull().default('active'),
  enrollmentDate: date('enrollment_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const guardians = pgTable('guardians', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  cpf: text('cpf'),
  profession: text('profession'),
  relationship: text('relationship').notNull(),
  isResponsible: boolean('is_responsible').notNull().default(false),
  isAuthorizedPickup: boolean('is_authorized_pickup').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})
