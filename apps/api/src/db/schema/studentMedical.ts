import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { students } from './students'

export const studentMedical = pgTable('student_medical', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  studentId: uuid('student_id').notNull().unique().references(() => students.id, { onDelete: 'cascade' }),
  allergies: text('allergies'),
  medications: text('medications'),
  foodRestrictions: text('food_restrictions'),
  diseases: text('diseases'),
  medicalContact: text('medical_contact'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
