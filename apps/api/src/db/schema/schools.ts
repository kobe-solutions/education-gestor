import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const schools = pgTable('schools', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('gestor'),
  director: text('director'),
  coordinator: text('coordinator'),
  phone: text('phone'),
  address: text('address'),
  logoUrl: text('logo_url'),
  showFinancial: boolean('show_financial').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})
