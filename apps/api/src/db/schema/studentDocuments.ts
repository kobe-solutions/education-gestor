import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { students } from './students'

export const studentDocuments = pgTable('student_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'historico' | 'boletim' | 'identidade' | 'outros'
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
