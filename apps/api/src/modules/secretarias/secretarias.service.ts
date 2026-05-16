import { hashPassword } from '../../lib/crypto'
import {
  createSecretariaRepository,
  findSecretariaByEmailRepository,
  addSchoolToSecretariaRepository,
  removeSchoolFromSecretariaRepository,
  findSchoolsBySecretariaIdRepository,
  findSecretariaByIdRepository,
  findSecretariaSchoolLinkRepository,
  listSecretariasRepository,
  updateSecretariaRepository,
  deleteSecretariaRepository,
  updateSecretariaPasswordRepository,
} from './secretarias.repository'
import { findSchoolByIdRepository } from '../schools/schools.repository'

type CreateSecretariaServiceInput = {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  responsible?: string
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
    phone: input.phone ?? null,
    address: input.address ?? null,
    responsible: input.responsible ?? null,
  })
}

type UpdateSecretariaServiceInput = {
  name?: string
  email?: string
  phone?: string | null
  address?: string | null
  responsible?: string | null
  active?: boolean
}

export async function updateSecretariaService(id: string, data: UpdateSecretariaServiceInput) {
  const secretaria = await findSecretariaByIdRepository(id)
  if (!secretaria) {
    throw new Error('Secretaria not found')
  }

  if (data.email && data.email !== secretaria.email) {
    const normalizedEmail = data.email.toLowerCase().trim()
    const existing = await findSecretariaByEmailRepository(normalizedEmail)
    if (existing) {
      throw new Error('Email already in use')
    }
    data.email = normalizedEmail
  }

  return updateSecretariaRepository(id, data)
}

export async function changeSecretariaPasswordService(id: string, password: string) {
  const secretaria = await findSecretariaByIdRepository(id)
  if (!secretaria) throw new Error('Secretaria not found')
  const hash = hashPassword(password)
  await updateSecretariaPasswordRepository(id, hash)
}

export async function deleteSecretariaService(id: string) {
  const secretaria = await findSecretariaByIdRepository(id)
  if (!secretaria) {
    throw new Error('Secretaria not found')
  }

  await deleteSecretariaRepository(id)
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

export async function listSecretariasService() {
  return listSecretariasRepository()
}

export async function listSchoolsBySecretariaService(secretariaId: string) {
  const secretaria = await findSecretariaByIdRepository(secretariaId)
  if (!secretaria) {
    throw new Error('Secretaria not found')
  }

  return findSchoolsBySecretariaIdRepository(secretariaId)
}
