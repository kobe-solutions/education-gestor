import { hashPassword, verifyPassword } from '../../lib/crypto'
import {
  createTeacherRepository,
  findTeacherByEmailRepository,
  findAllTeachersRepository,
  findTeacherByIdRepository,
  updateTeacherRepository,
  deleteTeacherRepository,
  updateTeacherPasswordRepository,
} from './teachers.repository'
import type { CreateTeacherBody, UpdateTeacherBody } from './teachers.schema'

export async function createTeacherService(schoolId: string, input: CreateTeacherBody) {
  const normalizedEmail = input.email.toLowerCase().trim()
  const existing = await findTeacherByEmailRepository(schoolId, normalizedEmail)
  if (existing) throw new Error('Teacher already exists with this email')

  return createTeacherRepository({
    schoolId,
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    role: 'professor',
    cpf: input.cpf,
    rg: input.rg,
    birthDate: input.birthDate,
    sex: input.sex,
    nationality: input.nationality,
    maritalStatus: input.maritalStatus,
    phone: input.phone,
    addressCep: input.addressCep,
    addressStreet: input.addressStreet,
    addressNumber: input.addressNumber,
    addressComplement: input.addressComplement,
    addressNeighborhood: input.addressNeighborhood,
    addressCity: input.addressCity,
    addressState: input.addressState,
    position: input.position,
    contractType: input.contractType,
    workload: input.workload,
    workShift: input.workShift,
    educationLevel: input.educationLevel,
    degree: input.degree,
    institution: input.institution,
    professionalRegistry: input.professionalRegistry,
    bank: input.bank,
    agency: input.agency,
    accountNumber: input.accountNumber,
    accountType: input.accountType,
    pixKey: input.pixKey,
  })
}

export async function listTeachersService(
  schoolId: string,
  pagination: { limit?: number; offset?: number } = {},
) {
  return findAllTeachersRepository(schoolId, pagination)
}

export async function getTeacherService(schoolId: string, id: string) {
  const teacher = await findTeacherByIdRepository(schoolId, id)
  if (!teacher) throw new Error('Teacher not found')
  return teacher
}

export async function updateTeacherService(schoolId: string, id: string, input: UpdateTeacherBody) {
  const teacher = await findTeacherByIdRepository(schoolId, id)
  if (!teacher) throw new Error('Teacher not found')

  const updated = await updateTeacherRepository(schoolId, id, {
    ...input,
    name: input.name?.trim(),
    email: input.email?.toLowerCase().trim(),
  })
  if (!updated) throw new Error('Teacher not found')
  return updated
}

export async function deleteTeacherService(schoolId: string, id: string) {
  const teacher = await findTeacherByIdRepository(schoolId, id)
  if (!teacher) throw new Error('Teacher not found')
  await deleteTeacherRepository(schoolId, id)
}

export async function changeTeacherPasswordService(schoolId: string, id: string, password: string) {
  const teacher = await findTeacherByIdRepository(schoolId, id)
  if (!teacher) throw new Error('Teacher not found')
  await updateTeacherPasswordRepository(schoolId, id, hashPassword(password))
}

