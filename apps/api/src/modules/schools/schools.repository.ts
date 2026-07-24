import { eq, or, and, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { schools, secretariaSchools } from '../../db/schema'

const schoolFields = {
  id: schools.id,
  name: schools.name,
  slug: schools.slug,
  email: schools.email,
  director: schools.director,
  coordinator: schools.coordinator,
  phone: schools.phone,
  address: schools.address,
  createdAt: schools.createdAt,
}

type CreateSchoolRepositoryInput = {
  name: string
  slug: string
  email: string
  passwordHash: string
  director?: string | null
  coordinator?: string | null
  phone?: string | null
  address?: string | null
}

export async function createSchoolRepository(input: CreateSchoolRepositoryInput) {
  const [school] = await db
    .insert(schools)
    .values({
      name: input.name,
      slug: input.slug,
      email: input.email,
      passwordHash: input.passwordHash,
      director: input.director ?? null,
      coordinator: input.coordinator ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
    })
    .returning(schoolFields)

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
    .where(and(eq(schools.email, email), isNull(schools.deletedAt)))
    .limit(1)

  return school
}

export async function findSchoolByIdRepository(id: string) {
  const [school] = await db
    .select(schoolFields)
    .from(schools)
    .where(and(eq(schools.id, id), isNull(schools.deletedAt)))
    .limit(1)

  return school
}

export async function findSchoolBySlugOrEmailRepository(slug: string, email: string) {
  const [school] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(or(eq(schools.slug, slug), eq(schools.email, email)))
    .limit(1)

  return school
}

export async function listSchoolsRepository() {
  return db.select(schoolFields).from(schools).where(isNull(schools.deletedAt))
}

export async function updateSchoolRepository(
  id: string,
  input: {
    name?: string
    slug?: string
    email?: string
    director?: string | null
    coordinator?: string | null
    phone?: string | null
    address?: string | null
  },
) {
  const [school] = await db
    .update(schools)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schools.id, id))
    .returning(schoolFields)

  return school
}

export async function updateSchoolPasswordRepository(id: string, passwordHash: string) {
  await db
    .update(schools)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(schools.id, id))
}

export async function deleteSchoolRepository(id: string) {
  await db.update(schools).set({ deletedAt: new Date() }).where(eq(schools.id, id))
}

export async function linkSchoolToSecretariaRepository(schoolId: string, secretariaId: string) {
  await db
    .insert(secretariaSchools)
    .values({ schoolId, secretariaId })
    .onConflictDoNothing()
}

export async function listSchoolsBySecretariaRepository(secretariaId: string) {
  return db
    .select(schoolFields)
    .from(secretariaSchools)
    .innerJoin(schools, eq(secretariaSchools.schoolId, schools.id))
    .where(eq(secretariaSchools.secretariaId, secretariaId))
}

export async function isSchoolOwnedBySecretariaRepository(schoolId: string, secretariaId: string) {
  const [link] = await db
    .select({ id: secretariaSchools.id })
    .from(secretariaSchools)
    .where(and(eq(secretariaSchools.schoolId, schoolId), eq(secretariaSchools.secretariaId, secretariaId)))
    .limit(1)

  return !!link
}
