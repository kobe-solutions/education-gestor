import { eq, and, count, inArray } from 'drizzle-orm'
import { db } from '../../db'
import { schoolClasses, classStudents, students, series, educationLevels } from '../../db/schema'

type CreateSchoolClassRepositoryInput = {
  schoolId: string
  name: string
  shift: string
  serieId?: string | null
  academicYearId?: string | null
}

type UpdateSchoolClassRepositoryInput = {
  name?: string
  shift?: string
  serieId?: string | null
  academicYearId?: string | null
}

const classFields = {
  id: schoolClasses.id,
  schoolId: schoolClasses.schoolId,
  name: schoolClasses.name,
  shift: schoolClasses.shift,
  serieId: schoolClasses.serieId,
  maxStudents: schoolClasses.maxStudents,
  createdAt: schoolClasses.createdAt,
  updatedAt: schoolClasses.updatedAt,
}

export async function findAllSchoolClassesRepository(schoolId: string) {
  return db
    .select({
      ...classFields,
      serie: {
        id: series.id,
        name: series.name,
        educationLevel: {
          id: educationLevels.id,
          name: educationLevels.name,
          type: educationLevels.type,
        },
      },
    } as any)
    .from(schoolClasses)
    .leftJoin(series, eq(schoolClasses.serieId, series.id))
    .leftJoin(educationLevels, eq(series.educationLevelId, educationLevels.id))
    .where(eq(schoolClasses.schoolId, schoolId))
}

export async function findSchoolClassByIdRepository(schoolId: string, id: string) {
  const [schoolClass] = await db
    .select({
      ...classFields,
      serie: {
        id: series.id,
        name: series.name,
        educationLevel: {
          id: educationLevels.id,
          name: educationLevels.name,
          type: educationLevels.type,
        },
      },
    } as any)
    .from(schoolClasses)
    .leftJoin(series, eq(schoolClasses.serieId, series.id))
    .leftJoin(educationLevels, eq(series.educationLevelId, educationLevels.id))
    .where(and(eq(schoolClasses.schoolId, schoolId), eq(schoolClasses.id, id)))
    .limit(1)

  return schoolClass
}

export async function createSchoolClassRepository(input: CreateSchoolClassRepositoryInput) {
  const [schoolClass] = await db
    .insert(schoolClasses)
    .values({
      schoolId: input.schoolId,
      name: input.name,
      shift: input.shift,
      serieId: input.serieId ?? null,
    })
    .returning(classFields)

  return schoolClass
}

export async function updateSchoolClassRepository(
  schoolId: string,
  id: string,
  input: UpdateSchoolClassRepositoryInput,
) {
  const [schoolClass] = await db
    .update(schoolClasses)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(schoolClasses.schoolId, schoolId), eq(schoolClasses.id, id)))
    .returning(classFields)

  return schoolClass
}

export async function deleteSchoolClassRepository(schoolId: string, id: string) {
  await db
    .delete(schoolClasses)
    .where(and(eq(schoolClasses.schoolId, schoolId), eq(schoolClasses.id, id)))
}

export async function addStudentToClassRepository(classId: string, studentId: string) {
  const [link] = await db
    .insert(classStudents)
    .values({ classId, studentId })
    .returning({
      id: classStudents.id,
      classId: classStudents.classId,
      studentId: classStudents.studentId,
      createdAt: classStudents.createdAt,
    })

  return link
}

export async function removeStudentFromClassRepository(classId: string, studentId: string) {
  await db
    .delete(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)))
}

export async function findClassStudentLinkRepository(classId: string, studentId: string) {
  const [link] = await db
    .select({ id: classStudents.id })
    .from(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)))
    .limit(1)

  return link
}

export async function findStudentsByClassRepository(classId: string) {
  return db
    .select({
      id: students.id,
      name: students.name,
      enrollmentCode: students.enrollmentCode,
    })
    .from(classStudents)
    .innerJoin(students, eq(classStudents.studentId, students.id))
    .where(eq(classStudents.classId, classId))
}

export async function countStudentsByClassesRepository(classIds: string[]) {
  if (classIds.length === 0) return {} as Record<string, number>
  const rows = await db
    .select({ classId: classStudents.classId, total: count() })
    .from(classStudents)
    .where(inArray(classStudents.classId, classIds))
    .groupBy(classStudents.classId)
  return Object.fromEntries(rows.map((r) => [r.classId, Number(r.total)])) as Record<string, number>
}

export async function findClassesByStudentRepository(schoolId: string, studentId: string) {
  return db
    .select({
      id: schoolClasses.id,
      name: schoolClasses.name,
      shift: schoolClasses.shift,
      serieId: schoolClasses.serieId,
    })
    .from(classStudents)
    .innerJoin(schoolClasses, eq(classStudents.classId, schoolClasses.id))
    .where(and(eq(classStudents.studentId, studentId), eq(schoolClasses.schoolId, schoolId)))
}

export async function findStudentCurrentClassRepository(studentId: string) {
  const [result] = await db
    .select({
      classId: classStudents.classId,
      className: schoolClasses.name,
    })
    .from(classStudents)
    .innerJoin(schoolClasses, eq(classStudents.classId, schoolClasses.id))
    .where(eq(classStudents.studentId, studentId))
    .limit(1)

  return result
}
