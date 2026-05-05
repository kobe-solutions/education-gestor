import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { secretarias, secretariaSchools, schools } from '../../db/schema'

type CreateSecretariaRepositoryInput = {
  name: string
  email: string
  passwordHash: string
}

export async function createSecretariaRepository(input: CreateSecretariaRepositoryInput) {
  const [secretaria] = await db
    .insert(secretarias)
    .values({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
    })
    .returning({
      id: secretarias.id,
      name: secretarias.name,
      email: secretarias.email,
      role: secretarias.role,
      createdAt: secretarias.createdAt,
    })

  return secretaria
}

export async function findSecretariaByEmailRepository(email: string) {
  const [secretaria] = await db
    .select({
      id: secretarias.id,
      email: secretarias.email,
      passwordHash: secretarias.passwordHash,
      role: secretarias.role,
    })
    .from(secretarias)
    .where(eq(secretarias.email, email))
    .limit(1)

  return secretaria
}

export async function findSecretariaByIdRepository(id: string) {
  const [secretaria] = await db
    .select({
      id: secretarias.id,
      name: secretarias.name,
      email: secretarias.email,
      role: secretarias.role,
      createdAt: secretarias.createdAt,
    })
    .from(secretarias)
    .where(eq(secretarias.id, id))
    .limit(1)

  return secretaria
}

export async function addSchoolToSecretariaRepository(secretariaId: string, schoolId: string) {
  const [link] = await db
    .insert(secretariaSchools)
    .values({ secretariaId, schoolId })
    .returning({
      id: secretariaSchools.id,
      secretariaId: secretariaSchools.secretariaId,
      schoolId: secretariaSchools.schoolId,
      createdAt: secretariaSchools.createdAt,
    })

  return link
}

export async function removeSchoolFromSecretariaRepository(secretariaId: string, schoolId: string) {
  await db
    .delete(secretariaSchools)
    .where(
      and(
        eq(secretariaSchools.secretariaId, secretariaId),
        eq(secretariaSchools.schoolId, schoolId),
      ),
    )
}

export async function findSchoolsBySecretariaIdRepository(secretariaId: string) {
  return db
    .select({
      id: schools.id,
      name: schools.name,
      slug: schools.slug,
      email: schools.email,
      createdAt: schools.createdAt,
    })
    .from(secretariaSchools)
    .innerJoin(schools, eq(secretariaSchools.schoolId, schools.id))
    .where(eq(secretariaSchools.secretariaId, secretariaId))
}

export async function findSecretariaSchoolLinkRepository(secretariaId: string, schoolId: string) {
  const [link] = await db
    .select({ id: secretariaSchools.id })
    .from(secretariaSchools)
    .where(
      and(
        eq(secretariaSchools.secretariaId, secretariaId),
        eq(secretariaSchools.schoolId, schoolId),
      ),
    )
    .limit(1)

  return link
}
