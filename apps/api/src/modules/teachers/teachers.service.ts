import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import {
  createTeacherRepository,
  findTeacherByEmailRepository,
  findTeacherForAuthRepository,
  findAllTeachersRepository,
  findTeacherByIdRepository,
  updateTeacherRepository,
  deleteTeacherRepository,
} from './teachers.repository'

type CreateTeacherServiceInput = {
  schoolId: string
  name: string
  email: string
  password: string
}

type AuthenticateTeacherServiceInput = {
  schoolId: string
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

export async function createTeacherService(input: CreateTeacherServiceInput) {
  const normalizedEmail = input.email.toLowerCase().trim()
  const teacherAlreadyExists = await findTeacherByEmailRepository(input.schoolId, normalizedEmail)

  if (teacherAlreadyExists) {
    throw new Error('Teacher already exists with this email')
  }

  const teacher = await createTeacherRepository({
    schoolId: input.schoolId,
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    role: 'professor',
  })

  return teacher
}

export async function listTeachersService(schoolId: string) {
  return findAllTeachersRepository(schoolId)
}

export async function getTeacherService(schoolId: string, id: string) {
  const teacher = await findTeacherByIdRepository(schoolId, id)
  if (!teacher) throw new Error('Teacher not found')
  return teacher
}

export async function updateTeacherService(
  schoolId: string,
  id: string,
  input: { name?: string; email?: string },
) {
  const teacher = await findTeacherByIdRepository(schoolId, id)
  if (!teacher) throw new Error('Teacher not found')
  const updated = await updateTeacherRepository(schoolId, id, input)
  if (!updated) throw new Error('Teacher not found')
  return updated
}

export async function deleteTeacherService(schoolId: string, id: string) {
  const teacher = await findTeacherByIdRepository(schoolId, id)
  if (!teacher) throw new Error('Teacher not found')
  await deleteTeacherRepository(schoolId, id)
}

export async function authenticateTeacherService(input: AuthenticateTeacherServiceInput) {
  const normalizedEmail = input.email.toLowerCase().trim()
  const teacher = await findTeacherForAuthRepository(input.schoolId, normalizedEmail)

  if (!teacher) {
    throw new Error('Invalid credentials')
  }

  const passwordMatches = verifyPassword(input.password, teacher.passwordHash)

  if (!passwordMatches) {
    throw new Error('Invalid credentials')
  }

  return {
    userId: teacher.id,
    schoolId: teacher.schoolId,
    role: 'professor' as const,
  }
}
