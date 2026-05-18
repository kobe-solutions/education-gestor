import { eq, and, count, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { teachers, teacherSubjects, subjects } from '../../db/schema'

type CreateTeacherInput = {
  schoolId: string
  name: string
  email: string
  passwordHash: string
  role: 'professor'
  cpf?: string
  rg?: string
  birthDate?: string
  sex?: string
  nationality?: string
  maritalStatus?: string
  phone?: string
  addressCep?: string
  addressStreet?: string
  addressNumber?: string
  addressComplement?: string
  addressNeighborhood?: string
  addressCity?: string
  addressState?: string
  position?: string
  contractType?: string
  workload?: string
  workShift?: string
  educationLevel?: string
  degree?: string
  institution?: string
  professionalRegistry?: string
  bank?: string
  agency?: string
  accountNumber?: string
  accountType?: string
  pixKey?: string
}

type UpdateTeacherInput = Partial<Omit<CreateTeacherInput, 'schoolId' | 'passwordHash' | 'role'>> & {
  employmentStatus?: string
  photoUrl?: string
}

const teacherFields = {
  id: teachers.id,
  schoolId: teachers.schoolId,
  name: teachers.name,
  email: teachers.email,
  role: teachers.role,
  cpf: teachers.cpf,
  rg: teachers.rg,
  birthDate: teachers.birthDate,
  sex: teachers.sex,
  nationality: teachers.nationality,
  maritalStatus: teachers.maritalStatus,
  photoUrl: teachers.photoUrl,
  phone: teachers.phone,
  addressCep: teachers.addressCep,
  addressStreet: teachers.addressStreet,
  addressNumber: teachers.addressNumber,
  addressComplement: teachers.addressComplement,
  addressNeighborhood: teachers.addressNeighborhood,
  addressCity: teachers.addressCity,
  addressState: teachers.addressState,
  position: teachers.position,
  contractType: teachers.contractType,
  workload: teachers.workload,
  workShift: teachers.workShift,
  employmentStatus: teachers.employmentStatus,
  educationLevel: teachers.educationLevel,
  degree: teachers.degree,
  institution: teachers.institution,
  professionalRegistry: teachers.professionalRegistry,
  bank: teachers.bank,
  agency: teachers.agency,
  accountNumber: teachers.accountNumber,
  accountType: teachers.accountType,
  pixKey: teachers.pixKey,
  createdAt: teachers.createdAt,
  updatedAt: teachers.updatedAt,
}

export async function createTeacherRepository(input: CreateTeacherInput) {
  const [teacher] = await db
    .insert(teachers)
    .values(input)
    .returning(teacherFields)

  return teacher
}

export async function findTeacherByEmailRepository(schoolId: string, email: string) {
  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.email, email), isNull(teachers.deletedAt)))
    .limit(1)

  return teacher
}

export async function findTeacherForAuthRepository(schoolId: string, email: string) {
  const [teacher] = await db
    .select({
      id: teachers.id,
      schoolId: teachers.schoolId,
      email: teachers.email,
      passwordHash: teachers.passwordHash,
      role: teachers.role,
    })
    .from(teachers)
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.email, email)))
    .limit(1)

  return teacher
}

async function getTeacherSubjects(teacherId: string) {
  return db
    .select({ id: subjects.id, name: subjects.name, code: subjects.code })
    .from(teacherSubjects)
    .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
    .where(eq(teacherSubjects.teacherId, teacherId))
}

export async function findAllTeachersRepository(
  schoolId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const [rows, [countResult]] = await Promise.all([
    db.select(teacherFields).from(teachers)
      .where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt)))
      .limit(limit).offset(offset),
    db.select({ total: count() }).from(teachers)
      .where(and(eq(teachers.schoolId, schoolId), isNull(teachers.deletedAt))),
  ])

  const data = await Promise.all(
    rows.map(async (t) => ({ ...t, subjects: await getTeacherSubjects(t.id) })),
  )

  return { data, total: countResult.total }
}

export async function findTeacherByIdRepository(schoolId: string, id: string) {
  const [teacher] = await db
    .select(teacherFields)
    .from(teachers)
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.id, id), isNull(teachers.deletedAt)))
    .limit(1)

  if (!teacher) return undefined

  return { ...teacher, subjects: await getTeacherSubjects(teacher.id) }
}

export async function addSubjectToTeacherRepository(schoolId: string, teacherId: string, subjectId: string) {
  const [row] = await db
    .insert(teacherSubjects)
    .values({ teacherId, subjectId, schoolId })
    .onConflictDoNothing()
    .returning({ teacherId: teacherSubjects.teacherId, subjectId: teacherSubjects.subjectId })
  return row
}

export async function removeSubjectFromTeacherRepository(teacherId: string, subjectId: string) {
  await db
    .delete(teacherSubjects)
    .where(and(eq(teacherSubjects.teacherId, teacherId), eq(teacherSubjects.subjectId, subjectId)))
}

export async function updateTeacherRepository(schoolId: string, id: string, input: UpdateTeacherInput) {
  const [teacher] = await db
    .update(teachers)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.id, id)))
    .returning(teacherFields)

  return teacher
}

export async function deleteTeacherRepository(schoolId: string, id: string) {
  await db.update(teachers).set({ deletedAt: new Date() }).where(and(eq(teachers.schoolId, schoolId), eq(teachers.id, id)))
}

export async function updateTeacherPasswordRepository(schoolId: string, id: string, passwordHash: string) {
  await db
    .update(teachers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.id, id)))
}

export async function findTeachersByEmailRepository(email: string) {
  return db
    .select({
      id: teachers.id,
      name: teachers.name,
      schoolId: teachers.schoolId,
      email: teachers.email,
      passwordHash: teachers.passwordHash,
      role: teachers.role,
    })
    .from(teachers)
    .where(eq(teachers.email, email))
}
