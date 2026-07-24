import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const educationLevels = pgTable('education_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  type: text('type').notNull(),
  modality: text('modality'),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
