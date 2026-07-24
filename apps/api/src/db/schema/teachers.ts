import { pgTable, uuid, text, timestamp, date, uniqueIndex } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const teachers = pgTable(
  'teachers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id').notNull().references(() => schools.id),
    // Auth
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('professor'),
    // Identificação pessoal
    name: text('name').notNull(),
    cpf: text('cpf'),
    rg: text('rg'),
    birthDate: date('birth_date'),
    sex: text('sex'),
    nationality: text('nationality'),
    maritalStatus: text('marital_status'),
    photoUrl: text('photo_url'),
    // Contato
    phone: text('phone'),
    // Endereço
    addressCep: text('address_cep'),
    addressStreet: text('address_street'),
    addressNumber: text('address_number'),
    addressComplement: text('address_complement'),
    addressNeighborhood: text('address_neighborhood'),
    addressCity: text('address_city'),
    addressState: text('address_state'),
    // Dados profissionais
    position: text('position'),
    contractType: text('contract_type'),
    workload: text('workload'),
    workShift: text('work_shift'),
    employmentStatus: text('employment_status').notNull().default('ativo'),
    // Formação acadêmica
    educationLevel: text('education_level'),
    degree: text('degree'),
    institution: text('institution'),
    professionalRegistry: text('professional_registry'),
    // Dados financeiros
    bank: text('bank'),
    agency: text('agency'),
    accountNumber: text('account_number'),
    accountType: text('account_type'),
    pixKey: text('pix_key'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    schoolEmailUnique: uniqueIndex('teachers_school_email_unique').on(table.schoolId, table.email),
  }),
)
