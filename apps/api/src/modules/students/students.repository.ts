import { eq, and, sql, count, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { students, guardians, studentMedical, studentDocuments } from '../../db/schema'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CreateStudentInput = {
  schoolId: string
  name: string
  email?: string
  cpf?: string
  rg?: string
  birthDate?: string
  sex?: string
  bloodType?: string
  naturalidade?: string
  phone?: string
  motherName?: string
  fatherName?: string
  motherPhone?: string
  addressCep?: string
  addressStreet?: string
  addressNumber?: string
  addressComplement?: string
  addressNeighborhood?: string
  addressCity?: string
  addressState?: string
  comorbidities?: string
  observations?: string
  enrollmentCode: string
  internalCode?: string
  enrollmentDate?: string
}

type UpdateStudentInput = Partial<Omit<CreateStudentInput, 'schoolId' | 'enrollmentCode'>> & {
  enrollmentCode?: string
  enrollmentStatus?: string
  photoUrl?: string
}

type CreateGuardianInput = {
  studentId: string
  name: string
  email?: string
  phone?: string
  cpf?: string
  profession?: string
  relationship: string
  isResponsible: boolean
  isAuthorizedPickup: boolean
}

type UpsertMedicalInput = {
  schoolId: string
  studentId: string
  allergies?: string
  medications?: string
  foodRestrictions?: string
  diseases?: string
  medicalContact?: string
}

type CreateDocumentInput = {
  schoolId: string
  studentId: string
  name: string
  type: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
}

// ─── Campos comuns retornados ──────────────────────────────────────────────────

const studentFields = {
  id: students.id,
  schoolId: students.schoolId,
  name: students.name,
  email: students.email,
  cpf: students.cpf,
  rg: students.rg,
  birthDate: students.birthDate,
  sex: students.sex,
  bloodType: students.bloodType,
  naturalidade: students.naturalidade,
  photoUrl: students.photoUrl,
  phone: students.phone,
  motherName: students.motherName,
  fatherName: students.fatherName,
  motherPhone: students.motherPhone,
  addressCep: students.addressCep,
  addressStreet: students.addressStreet,
  addressNumber: students.addressNumber,
  addressComplement: students.addressComplement,
  addressNeighborhood: students.addressNeighborhood,
  addressCity: students.addressCity,
  addressState: students.addressState,
  comorbidities: students.comorbidities,
  observations: students.observations,
  enrollmentCode: students.enrollmentCode,
  internalCode: students.internalCode,
  enrollmentStatus: students.enrollmentStatus,
  enrollmentDate: students.enrollmentDate,
  createdAt: students.createdAt,
  updatedAt: students.updatedAt,
}

// ─── Matrícula auto-gerada ─────────────────────────────────────────────────────

export async function generateEnrollmentCodeRepository(schoolId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `${year}`

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(
      and(
        eq(students.schoolId, schoolId),
        sql`enrollment_code LIKE ${prefix + '%'}`,
      ),
    )

  const seq = (Number(result[0]?.count) ?? 0) + 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}

// ─── Alunos ────────────────────────────────────────────────────────────────────

export async function findAllStudentsRepository(
  schoolId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const [data, [countResult]] = await Promise.all([
    db.select(studentFields).from(students)
      .where(and(eq(students.schoolId, schoolId), isNull(students.deletedAt)))
      .limit(limit).offset(offset),
    db.select({ total: count() }).from(students)
      .where(and(eq(students.schoolId, schoolId), isNull(students.deletedAt))),
  ])
  return { data, total: countResult.total }
}

export async function findStudentByIdRepository(schoolId: string, id: string) {
  const [student] = await db
    .select(studentFields)
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.id, id), isNull(students.deletedAt)))
    .limit(1)

  return student
}

export async function findStudentByEnrollmentCodeRepository(schoolId: string, enrollmentCode: string) {
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.enrollmentCode, enrollmentCode)))
    .limit(1)

  return student
}

export async function createStudentRepository(input: CreateStudentInput) {
  const [student] = await db
    .insert(students)
    .values(input)
    .returning(studentFields)

  return student
}

export async function updateStudentRepository(schoolId: string, id: string, input: UpdateStudentInput) {
  const [student] = await db
    .update(students)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(students.schoolId, schoolId), eq(students.id, id)))
    .returning(studentFields)

  return student
}

export async function deleteStudentRepository(schoolId: string, id: string) {
  await db.update(students).set({ deletedAt: new Date() }).where(and(eq(students.schoolId, schoolId), eq(students.id, id)))
}

// ─── Responsáveis / autorizados ────────────────────────────────────────────────

export async function createGuardianRepository(input: CreateGuardianInput) {
  const [guardian] = await db
    .insert(guardians)
    .values(input)
    .returning()

  return guardian
}

export async function updateGuardianRepository(id: string, input: Partial<CreateGuardianInput>) {
  const [guardian] = await db
    .update(guardians)
    .set(input)
    .where(eq(guardians.id, id))
    .returning()

  return guardian
}

export async function deleteGuardianRepository(id: string) {
  await db.delete(guardians).where(eq(guardians.id, id))
}

export async function findGuardiansByStudentIdRepository(studentId: string) {
  return db.select().from(guardians).where(eq(guardians.studentId, studentId))
}

// ─── Ficha médica ──────────────────────────────────────────────────────────────

export async function upsertMedicalRepository(input: UpsertMedicalInput) {
  const existing = await db
    .select({ id: studentMedical.id })
    .from(studentMedical)
    .where(eq(studentMedical.studentId, input.studentId))
    .limit(1)

  if (existing.length) {
    const [record] = await db
      .update(studentMedical)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(studentMedical.id, existing[0].id))
      .returning()
    return record
  }

  const [record] = await db.insert(studentMedical).values(input).returning()
  return record
}

export async function findMedicalByStudentRepository(schoolId: string, studentId: string) {
  const [record] = await db
    .select()
    .from(studentMedical)
    .where(and(eq(studentMedical.schoolId, schoolId), eq(studentMedical.studentId, studentId)))
    .limit(1)

  return record ?? null
}

// ─── Documentos ────────────────────────────────────────────────────────────────

export async function createDocumentRepository(input: CreateDocumentInput) {
  const [doc] = await db.insert(studentDocuments).values(input).returning()
  return doc
}

export async function findDocumentsByStudentRepository(schoolId: string, studentId: string) {
  return db
    .select()
    .from(studentDocuments)
    .where(and(eq(studentDocuments.schoolId, schoolId), eq(studentDocuments.studentId, studentId)))
}

export async function findDocumentByIdRepository(id: string) {
  const [doc] = await db
    .select()
    .from(studentDocuments)
    .where(eq(studentDocuments.id, id))
    .limit(1)

  return doc
}

export async function deleteDocumentRepository(id: string) {
  await db.delete(studentDocuments).where(eq(studentDocuments.id, id))
}

export async function findStudentProfileRepository(schoolId: string, studentId: string) {
  const [student, guardiansList, medical] = await Promise.all([
    findStudentByIdRepository(schoolId, studentId),
    findGuardiansByStudentIdRepository(studentId),
    findMedicalByStudentRepository(schoolId, studentId),
  ])
  if (!student) return null
  return { ...student, guardians: guardiansList, medical: medical ?? null }
}
