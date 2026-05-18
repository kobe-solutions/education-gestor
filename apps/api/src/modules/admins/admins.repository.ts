import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { admins } from '../../db/schema'

type CreateAdminRepositoryInput = {
  name: string
  email: string
  passwordHash: string
}

export async function createAdminRepository(input: CreateAdminRepositoryInput) {
  const [admin] = await db
    .insert(admins)
    .values({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
    })
    .returning({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      role: admins.role,
      createdAt: admins.createdAt,
    })

  return admin
}

export async function findAdminByEmailRepository(email: string) {
  const [admin] = await db
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      passwordHash: admins.passwordHash,
      role: admins.role,
    })
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1)

  return admin
}
