import { randomBytes, scryptSync } from 'node:crypto'
import {
  createSecretariaRepository,
  findSecretariaByEmailRepository,
  addSchoolToSecretariaRepository,
  removeSchoolFromSecretariaRepository,
  findSchoolsBySecretariaIdRepository,
  findSecretariaByIdRepository,
  findSecretariaSchoolLinkRepository,
} from './secretarias.repository'
import { findSchoolByIdRepository } from '../schools/schools.repository'

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

type CreateSecretariaServiceInput = {
  name: string
  email: string
  password: string
}

export async function createSecretariaService(input: CreateSecretariaServiceInput) {
  const normalizedEmail = input.email.toLowerCase().trim()
  const existing = await findSecretariaByEmailRepository(normalizedEmail)

  if (existing) {
    throw new Error('Secretaria already exists with this email')
  }

  return createSecretariaRepository({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
  })
}

export async function addSchoolToSecretariaService(secretariaId: string, schoolId: string) {
  const secretaria = await findSecretariaByIdRepository(secretariaId)
  if (!secretaria) {
    throw new Error('Secretaria not found')
  }

  const school = await findSchoolByIdRepository(schoolId)
  if (!school) {
    throw new Error('School not found')
  }

  const alreadyLinked = await findSecretariaSchoolLinkRepository(secretariaId, schoolId)
  if (alreadyLinked) {
    throw new Error('School already linked to this secretaria')
  }

  return addSchoolToSecretariaRepository(secretariaId, schoolId)
}

export async function removeSchoolFromSecretariaService(secretariaId: string, schoolId: string) {
  const link = await findSecretariaSchoolLinkRepository(secretariaId, schoolId)
  if (!link) {
    throw new Error('School not linked to this secretaria')
  }

  await removeSchoolFromSecretariaRepository(secretariaId, schoolId)
}

export async function listSchoolsBySecretariaService(secretariaId: string) {
  const secretaria = await findSecretariaByIdRepository(secretariaId)
  if (!secretaria) {
    throw new Error('Secretaria not found')
  }

  return findSchoolsBySecretariaIdRepository(secretariaId)
}
