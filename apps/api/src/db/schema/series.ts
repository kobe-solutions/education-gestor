import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { educationLevels } from './educationLevels'

export const series = pgTable('series', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  educationLevelId: uuid('education_level_id')
    .notNull()
    .references(() => educationLevels.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
