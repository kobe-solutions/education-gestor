import { pgTable, uuid, text, timestamp, uniqueIndex, boolean } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const secretarias = pgTable('secretarias', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('secretaria'),
  phone: text('phone'),
  address: text('address'),
  responsible: text('responsible'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const secretariaSchools = pgTable(
  'secretaria_schools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    secretariaId: uuid('secretaria_id')
      .notNull()
      .references(() => secretarias.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueSecretariaSchool: uniqueIndex('secretaria_schools_unique').on(
      table.secretariaId,
      table.schoolId,
    ),
  }),
)
