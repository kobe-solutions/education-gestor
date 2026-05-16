import { hashPassword } from '../../lib/crypto'
import { createAdminRepository, findAdminByEmailRepository } from './admins.repository'

type CreateAdminServiceInput = {
  name: string
  email: string
  password: string
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
