import {
  findAllStudentsRepository,
  findStudentByIdRepository,
  findStudentByEnrollmentCodeRepository,
  generateEnrollmentCodeRepository,
  createStudentRepository,
  updateStudentRepository,
  deleteStudentRepository,
  createGuardianRepository,
  updateGuardianRepository,
  deleteGuardianRepository,
  findGuardiansByStudentIdRepository,
  upsertMedicalRepository,
  findMedicalByStudentRepository,
  createDocumentRepository,
  findDocumentsByStudentRepository,
  findDocumentByIdRepository,
  deleteDocumentRepository,
  findStudentProfileRepository,
} from './students.repository'
import { uploadFile, deleteFile, extractKeyFromUrl } from '../../lib/storage'
import type { CreateStudentBody, UpdateStudentBody, UpsertMedicalBody, CreateGuardianBody } from './students.schema'

// ─── Alunos ────────────────────────────────────────────────────────────────────

export async function listStudentsService(
  schoolId: string,
  pagination: { limit?: number; offset?: number } = {},
) {
  return findAllStudentsRepository(schoolId, pagination)
}

export async function getStudentService(schoolId: string, id: string) {
  const student = await findStudentByIdRepository(schoolId, id)
  if (!student) throw new Error('Student not found')
  return student
}

export async function createStudentService(schoolId: string, input: CreateStudentBody) {
  const enrollmentCode = await generateEnrollmentCodeRepository(schoolId)

  return createStudentRepository({
    schoolId,
    ...input,
    name: input.name.trim(),
    email: input.email?.toLowerCase().trim(),
    enrollmentCode,
    enrollmentDate: input.enrollmentDate ?? new Date().toISOString().split('T')[0],
  })
}

export async function updateStudentService(schoolId: string, id: string, input: UpdateStudentBody) {
  const student = await findStudentByIdRepository(schoolId, id)
  if (!student) throw new Error('Student not found')

  if (input.enrollmentCode && input.enrollmentCode !== student.enrollmentCode) {
    const existing = await findStudentByEnrollmentCodeRepository(schoolId, input.enrollmentCode)
    if (existing) throw new Error('Enrollment code already in use')
  }

  const updated = await updateStudentRepository(schoolId, id, input)
  if (!updated) throw new Error('Student not found')
  return updated
}

export async function deleteStudentService(schoolId: string, id: string) {
  const student = await findStudentByIdRepository(schoolId, id)
  if (!student) throw new Error('Student not found')

  if (student.photoUrl) {
    await deleteFile(extractKeyFromUrl(student.photoUrl)).catch(() => null)
  }

  await deleteStudentRepository(schoolId, id)
}

// ─── Foto ─────────────────────────────────────────────────────────────────────

export async function uploadStudentPhotoService(
  schoolId: string,
  studentId: string,
  buffer: Buffer,
  mimeType: string,
  ext: string,
) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')

  if (student.photoUrl) {
    await deleteFile(extractKeyFromUrl(student.photoUrl)).catch(() => null)
  }

  const key = `schools/${schoolId}/students/${studentId}/photo.${ext}`
  const url = await uploadFile(key, buffer, mimeType)

  return updateStudentRepository(schoolId, studentId, { photoUrl: url })
}

// ─── Responsáveis / autorizados ────────────────────────────────────────────────

export async function listGuardiansService(schoolId: string, studentId: string) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findGuardiansByStudentIdRepository(studentId)
}

export async function addGuardianService(schoolId: string, studentId: string, input: CreateGuardianBody) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')

  return createGuardianRepository({
    studentId,
    name: input.name.trim(),
    email: input.email?.trim(),
    phone: input.phone?.trim(),
    cpf: input.cpf?.trim(),
    profession: input.profession?.trim(),
    relationship: input.relationship.trim(),
    isResponsible: input.isResponsible,
    isAuthorizedPickup: input.isAuthorizedPickup,
  })
}

export async function updateGuardianService(
  schoolId: string,
  studentId: string,
  guardianId: string,
  input: Partial<CreateGuardianBody>,
) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')

  const updated = await updateGuardianRepository(guardianId, input)
  if (!updated) throw new Error('Guardian not found')
  return updated
}

export async function deleteGuardianService(schoolId: string, studentId: string, guardianId: string) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  await deleteGuardianRepository(guardianId)
}

// ─── Ficha médica ──────────────────────────────────────────────────────────────

export async function getMedicalService(schoolId: string, studentId: string) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findMedicalByStudentRepository(schoolId, studentId)
}

export async function upsertMedicalService(schoolId: string, studentId: string, input: UpsertMedicalBody) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return upsertMedicalRepository({ schoolId, studentId, ...input })
}

// ─── Documentos ────────────────────────────────────────────────────────────────

export async function listDocumentsService(schoolId: string, studentId: string) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findDocumentsByStudentRepository(schoolId, studentId)
}

export async function uploadDocumentService(
  schoolId: string,
  studentId: string,
  buffer: Buffer,
  name: string,
  type: string,
  mimeType: string,
  fileSize: number,
  ext: string,
) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')

  const docId = crypto.randomUUID()
  const key = `schools/${schoolId}/students/${studentId}/documents/${docId}.${ext}`
  const fileUrl = await uploadFile(key, buffer, mimeType)

  return createDocumentRepository({ schoolId, studentId, name, type, fileUrl, fileSize, mimeType })
}

export async function deleteDocumentService(schoolId: string, studentId: string, docId: string) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')

  const doc = await findDocumentByIdRepository(docId)
  if (!doc || doc.studentId !== studentId) throw new Error('Document not found')

  await deleteFile(extractKeyFromUrl(doc.fileUrl)).catch(() => null)
  await deleteDocumentRepository(docId)
}

export async function getStudentProfileService(schoolId: string, studentId: string) {
  const profile = await findStudentProfileRepository(schoolId, studentId)
  if (!profile) throw new Error('Student not found')
  return profile
}
