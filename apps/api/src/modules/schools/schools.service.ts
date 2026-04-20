import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import {
  createSchoolRepository,
  findSchoolByEmailRepository,
  findSchoolBySlugOrEmailRepository,
} from './schools.repository'

type CreateSchoolServiceInput = {
  name: string
  slug: string
  email: string
  password: string
}

type AuthenticateSchoolServiceInput = {
  email: string
  password: string
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(':')

  if (!salt || !originalHash) {
    return false
  }

  const hashBuffer = scryptSync(password, salt, 64)
  const originalHashBuffer = Buffer.from(originalHash, 'hex')

  if (hashBuffer.length !== originalHashBuffer.length) {
    return false
  }

  return timingSafeEqual(hashBuffer, originalHashBuffer)
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
  })

  return {
    ...school,
    role: 'gestor' as const,
  }
}

export async function authenticateSchoolService(input: AuthenticateSchoolServiceInput) {
  const normalizedEmail = input.email.toLowerCase().trim()
  const school = await findSchoolByEmailRepository(normalizedEmail)

  if (!school) {
    throw new Error('Invalid credentials')
  }

  const passwordMatches = verifyPassword(input.password, school.passwordHash)

  if (!passwordMatches) {
    throw new Error('Invalid credentials')
  }

  return {
    userId: school.id,
    schoolId: school.id,
    role: 'gestor' as const,
  }
}
