import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { schoolClasses, classTeachers, classStudents, teachers, students } from '../../db/schema'

type CreateSchoolClassRepositoryInput = {
  schoolId: string
  name: string
  grade: string
  shift: string
  termTime: string
}

type UpdateSchoolClassRepositoryInput = {
  name?: string
  grade?: string
  shift?: string
  termTime?: string
}

export async function findAllSchoolClassesRepository(schoolId: string) {
  return db
    .select({
      id: schoolClasses.id,
      schoolId: schoolClasses.schoolId,
      name: schoolClasses.name,
      grade: schoolClasses.grade,
      shift: schoolClasses.shift,
      termTime: schoolClasses.termTime,
      createdAt: schoolClasses.createdAt,
      updatedAt: schoolClasses.updatedAt,
    })
    .from(schoolClasses)
    .where(eq(schoolClasses.schoolId, schoolId))
}

export async function findSchoolClassByIdRepository(schoolId: string, id: string) {
  const [schoolClass] = await db
    .select({
      id: schoolClasses.id,
      schoolId: schoolClasses.schoolId,
      name: schoolClasses.name,
      grade: schoolClasses.grade,
      shift: schoolClasses.shift,
      termTime: schoolClasses.termTime,
      createdAt: schoolClasses.createdAt,
      updatedAt: schoolClasses.updatedAt,
    })
    .from(schoolClasses)
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
      grade: input.grade,
      shift: input.shift,
      termTime: input.termTime,
    })
    .returning({
      id: schoolClasses.id,
      schoolId: schoolClasses.schoolId,
      name: schoolClasses.name,
      termTime: schoolClasses.termTime,
      grade: schoolClasses.grade,
      shift: schoolClasses.shift,
      createdAt: schoolClasses.createdAt,
    })

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
    .returning({
      id: schoolClasses.id,
      schoolId: schoolClasses.schoolId,
      name: schoolClasses.name,
      grade: schoolClasses.grade,
      shift: schoolClasses.shift,
      termTime: schoolClasses.termTime,
      createdAt: schoolClasses.createdAt,
      updatedAt: schoolClasses.updatedAt,
    })

  return schoolClass
}

export async function deleteSchoolClassRepository(schoolId: string, id: string) {
  await db
    .delete(schoolClasses)
    .where(and(eq(schoolClasses.schoolId, schoolId), eq(schoolClasses.id, id)))
}

export async function addTeacherToClassRepository(classId: string, teacherId: string) {
  const [link] = await db
    .insert(classTeachers)
    .values({ classId, teacherId })
    .returning({
      id: classTeachers.id,
      classId: classTeachers.classId,
      teacherId: classTeachers.teacherId,
      createdAt: classTeachers.createdAt,
    })

  return link
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

export async function findClassTeacherLinkRepository(classId: string, teacherId: string) {
  const [link] = await db
    .select({ id: classTeachers.id })
    .from(classTeachers)
    .where(and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, teacherId)))
    .limit(1)

  return link
}

export async function findClassStudentLinkRepository(classId: string, studentId: string) {
  const [link] = await db
    .select({ id: classStudents.id })
    .from(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)))
    .limit(1)

  return link
}

export async function findTeachersByClassRepository(classId: string) {
  return db
    .select({
      id: teachers.id,
      name: teachers.name,
      email: teachers.email,
      role: teachers.role,
    })
    .from(classTeachers)
    .innerJoin(teachers, eq(classTeachers.teacherId, teachers.id))
    .where(eq(classTeachers.classId, classId))
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
