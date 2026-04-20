import { randomBytes, scryptSync } from 'node:crypto'
import { createAdminRepository, findAdminByEmailRepository } from './admins.repository'

type CreateAdminServiceInput = {
  name: string
  email: string
  password: string
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export async function createAdminService(input: CreateAdminServiceInput) {
  const normalizedEmail = input.email.toLowerCase().trim()
  const adminAlreadyExists = await findAdminByEmailRepository(normalizedEmail)

  if (adminAlreadyExists) {
    throw new Error('Admin already exists with this email')
  }

  const admin = await createAdminRepository({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
  })

  return admin
}
