import { hashPassword } from '../../lib/crypto'
import {
  createSchoolRepository,
  findSchoolByEmailRepository,
  findSchoolByIdRepository,
  findSchoolBySlugOrEmailRepository,
  listSchoolsRepository,
  listSchoolsBySecretariaRepository,
  updateSchoolRepository,
  updateSchoolPasswordRepository,
  deleteSchoolRepository,
  linkSchoolToSecretariaRepository,
  isSchoolOwnedBySecretariaRepository,
} from './schools.repository'

type CreateSchoolServiceInput = {
  name: string
  slug: string
  email: string
  password: string
  secretariaId: string
  director?: string
  coordinator?: string
  phone?: string
  address?: string
}

export async function createSchoolService(input: CreateSchoolServiceInput) {
  const normalizedEmail = input.email.toLowerCase().trim()
  const normalizedSlug = input.slug.trim().toLowerCase()
  const existingSchool = await findSchoolBySlugOrEmailRepository(normalizedSlug, normalizedEmail)

  if (existingSchool) {
    throw new Error('School already exists with this slug or email')
  }

  const school = await createSchoolRepository({
    name: input.name.trim(),
    slug: normalizedSlug,
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    director: input.director?.trim() || null,
    coordinator: input.coordinator?.trim() || null,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
  })

  await linkSchoolToSecretariaRepository(school.id, input.secretariaId)

  return {
    ...school,
    role: 'gestor' as const,
  }
}

export async function listSchoolsService(secretariaId?: string) {
  if (secretariaId) return listSchoolsBySecretariaRepository(secretariaId)
  return listSchoolsRepository()
}

export async function getSchoolService(id: string) {
  const school = await findSchoolByIdRepository(id)
  if (!school) throw new Error('School not found')
  return school
}

type UpdateSchoolServiceInput = {
  name?: string
  slug?: string
  email?: string
  director?: string | null
  coordinator?: string | null
  phone?: string | null
  address?: string | null
}

type RequesterInfo = { role: string; secretariaId?: string }

async function assertOwnership(schoolId: string, requester: RequesterInfo) {
  if (requester.role === 'secretaria') {
    const owns = await isSchoolOwnedBySecretariaRepository(schoolId, requester.secretariaId!)
    if (!owns) throw new Error('Forbidden')
  }
}

export async function updateSchoolService(id: string, data: UpdateSchoolServiceInput, requester: RequesterInfo) {
  const school = await findSchoolByIdRepository(id)
  if (!school) throw new Error('School not found')
  await assertOwnership(id, requester)

  if (data.email || data.slug) {
    const existing = await findSchoolBySlugOrEmailRepository(
      data.slug ?? school.slug,
      data.email ?? school.email,
    )
    if (existing && existing.id !== id) {
      throw new Error('School already exists with this slug or email')
    }
  }

  if (data.email) data.email = data.email.toLowerCase().trim()
  if (data.slug) data.slug = data.slug.trim().toLowerCase()

  return updateSchoolRepository(id, data)
}

export async function changeSchoolPasswordService(id: string, password: string, requester: RequesterInfo) {
  const school = await findSchoolByIdRepository(id)
  if (!school) throw new Error('School not found')
  await assertOwnership(id, requester)
  await updateSchoolPasswordRepository(id, hashPassword(password))
}

export async function deleteSchoolService(id: string, requester: RequesterInfo) {
  const school = await findSchoolByIdRepository(id)
  if (!school) throw new Error('School not found')
  await assertOwnership(id, requester)
  await deleteSchoolRepository(id)
}

