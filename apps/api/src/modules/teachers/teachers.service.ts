import { eq, count } from 'drizzle-orm'
import { db } from '../../db'
import { secretariaSchools } from '../../db/schema/secretarias'
import { hashPassword, verifyPassword } from '../../lib/crypto'
import { deleteFile, extractKeyFromUrl, uploadFile } from '../../lib/storage'
import {
  createTeacherRepository,
  findTeacherByEmailRepository,
  findAllTeachersRepository,
  findTeacherByIdRepository,
  updateTeacherRepository,
  deleteTeacherRepository,
  updateTeacherPasswordRepository,
  addSubjectToTeacherRepository,
  removeSubjectFromTeacherRepository,
  createTeacherDocumentRepository,
  findTeacherDocumentsByTeacherRepository,
  findTeacherDocumentByIdRepository,
  deleteTeacherDocumentRepository,
} from './teachers.repository'
import type { CreateTeacherBody, UpdateTeacherBody } from './teachers.schema'

type RequesterInfo = { role: string; secretariaId?: string }

export async function createTeacherService(schoolId: string, input: CreateTeacherBody, requester?: RequesterInfo) {
  if (requester?.role === 'secretaria' && requester.secretariaId) {
    const [result] = await db
      .select({ total: count() })
      .from(secretariaSchools)
      .where(eq(secretariaSchools.secretariaId, requester.secretariaId))

    if (!result || result.total === 0) {
      throw new Error('Secretaria não possui escolas vinculadas')
    }
  }
  const normalizedEmail = input.email.toLowerCase().trim()
  const existing = await findTeacherByEmailRepository(schoolId, normalizedEmail)
  if (existing) throw new Error('Já existe um professor cadastrado com este e-mail')

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

  if (teacher.photoUrl) {
    await deleteFile(extractKeyFromUrl(teacher.photoUrl)).catch(() => null)
  }

  await deleteTeacherRepository(schoolId, id)
}

export async function changeTeacherPasswordService(schoolId: string, id: string, password: string) {
  const teacher = await findTeacherByIdRepository(schoolId, id)
  if (!teacher) throw new Error('Teacher not found')
  await updateTeacherPasswordRepository(schoolId, id, hashPassword(password))
}

export async function addTeacherSubjectService(schoolId: string, teacherId: string, subjectId: string) {
  const teacher = await findTeacherByIdRepository(schoolId, teacherId)
  if (!teacher) throw new Error('Teacher not found')
  return addSubjectToTeacherRepository(schoolId, teacherId, subjectId)
}

export async function removeTeacherSubjectService(schoolId: string, teacherId: string, subjectId: string) {
  const teacher = await findTeacherByIdRepository(schoolId, teacherId)
  if (!teacher) throw new Error('Teacher not found')
  await removeSubjectFromTeacherRepository(teacherId, subjectId)
}

export async function uploadTeacherPhotoService(
  schoolId: string,
  teacherId: string,
  buffer: Buffer,
  mimeType: string,
  ext: string,
) {
  const teacher = await findTeacherByIdRepository(schoolId, teacherId)
  if (!teacher) throw new Error('Teacher not found')

  if (teacher.photoUrl) {
    await deleteFile(extractKeyFromUrl(teacher.photoUrl)).catch(() => null)
  }

  const key = `schools/${schoolId}/teachers/${teacherId}/photo.${ext}`
  const url = await uploadFile(key, buffer, mimeType)

  return updateTeacherRepository(schoolId, teacherId, { photoUrl: url })
}

// ─── Documentos do Professor ─────────────────────────────────────────────────

export async function listTeacherDocumentsService(schoolId: string, teacherId: string) {
  const teacher = await findTeacherByIdRepository(schoolId, teacherId)
  if (!teacher) throw new Error('Teacher not found')
  return findTeacherDocumentsByTeacherRepository(schoolId, teacherId)
}

export async function uploadTeacherDocumentService(
  schoolId: string,
  teacherId: string,
  buffer: Buffer,
  name: string,
  type: string,
  mimeType: string,
  fileSize: number,
  ext: string,
) {
  const teacher = await findTeacherByIdRepository(schoolId, teacherId)
  if (!teacher) throw new Error('Teacher not found')

  const docId = crypto.randomUUID()
  const key = `schools/${schoolId}/teachers/${teacherId}/documents/${docId}.${ext}`
  const fileUrl = await uploadFile(key, buffer, mimeType)

  return createTeacherDocumentRepository({ schoolId, teacherId, name, type, fileUrl, fileSize, mimeType })
}

export async function deleteTeacherDocumentService(schoolId: string, teacherId: string, docId: string) {
  const teacher = await findTeacherByIdRepository(schoolId, teacherId)
  if (!teacher) throw new Error('Teacher not found')

  const doc = await findTeacherDocumentByIdRepository(docId)
  if (!doc || doc.teacherId !== teacherId) throw new Error('Document not found')

  await deleteFile(extractKeyFromUrl(doc.fileUrl)).catch(() => null)
  await deleteTeacherDocumentRepository(docId)
}

