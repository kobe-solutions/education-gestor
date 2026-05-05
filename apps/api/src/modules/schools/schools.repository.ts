import { eq, or } from 'drizzle-orm'
import { db } from '../../db'
import { schools } from '../../db/schema'

type CreateSchoolRepositoryInput = {
  name: string
  slug: string
  email: string
  passwordHash: string
}

export async function createSchoolRepository(input: CreateSchoolRepositoryInput) {
  const [school] = await db
    .insert(schools)
    .values({
      name: input.name,
      slug: input.slug,
      email: input.email,
      passwordHash: input.passwordHash,
    })
    .returning({
      id: schools.id,
      name: schools.name,
      slug: schools.slug,
      email: schools.email,
    })

  return school
}

export async function findSchoolByEmailRepository(email: string) {
  const [school] = await db
    .select({
      id: schools.id,
      name: schools.name,
      slug: schools.slug,
      email: schools.email,
      passwordHash: schools.passwordHash,
    })
    .from(schools)
    .where(eq(schools.email, email))
    .limit(1)

  return school
}

export async function findSchoolByIdRepository(id: string) {
  const [school] = await db
    .select({ id: schools.id, name: schools.name, slug: schools.slug, email: schools.email })
    .from(schools)
    .where(eq(schools.id, id))
    .limit(1)

  return school
}

export async function findSchoolBySlugOrEmailRepository(slug: string, email: string) {
  const [school] = await db
    .select({
      id: schools.id,
    })
    .from(schools)
    .where(or(eq(schools.slug, slug), eq(schools.email, email)))
    .limit(1)

  return school
}
