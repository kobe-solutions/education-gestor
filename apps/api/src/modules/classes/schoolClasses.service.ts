import {
  findAllSchoolClassesRepository,
  findSchoolClassByIdRepository,
  createSchoolClassRepository,
  updateSchoolClassRepository,
  deleteSchoolClassRepository,
  addTeacherToClassRepository,
  addStudentToClassRepository,
  removeStudentFromClassRepository,
  findClassTeacherLinkRepository,
  findClassStudentLinkRepository,
  findTeachersByClassRepository,
  findStudentsByClassRepository,
} from './schoolClasses.repository'
import { findTeacherByIdRepository } from '../teachers/teachers.repository'
import { findStudentByIdRepository } from '../students/students.repository'

type CreateSchoolClassServiceInput = {
  schoolId: string
  name: string
  grade: string
  termTime: string
  shift: string
}

type UpdateSchoolClassServiceInput = {
  name?: string
  grade?: string
  shift?: string
  termTime?: string
}

export async function listSchoolClassesService(schoolId: string) {
  return findAllSchoolClassesRepository(schoolId)
}

export async function getSchoolClassService(schoolId: string, id: string) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, id)
  if (!schoolClass) throw new Error('Class not found')

  const [classTeachers, classStudents] = await Promise.all([
    findTeachersByClassRepository(id),
    findStudentsByClassRepository(id),
  ])

  return { ...schoolClass, teachers: classTeachers, students: classStudents }
}

export async function createSchoolClassService(input: CreateSchoolClassServiceInput) {
  return createSchoolClassRepository({
    schoolId: input.schoolId,
    name: input.name.trim(),
    grade: input.grade,
    shift: input.shift,
    termTime: input.termTime,
  })
}

export async function updateSchoolClassService(
  schoolId: string,
  id: string,
  input: UpdateSchoolClassServiceInput,
) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, id)
  if (!schoolClass) throw new Error('Class not found')
  const updated = await updateSchoolClassRepository(schoolId, id, input)
  if (!updated) throw new Error('Class not found')
  return updated
}

export async function deleteSchoolClassService(schoolId: string, id: string) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, id)
  if (!schoolClass) throw new Error('Class not found')
  await deleteSchoolClassRepository(schoolId, id)
}

export async function addTeacherToClassService(schoolId: string, classId: string, teacherId: string) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')

  const teacher = await findTeacherByIdRepository(schoolId, teacherId)
  if (!teacher) throw new Error('Teacher not found')

  const alreadyLinked = await findClassTeacherLinkRepository(classId, teacherId)
  if (alreadyLinked) throw new Error('Teacher already in class')

  return addTeacherToClassRepository(classId, teacherId)
}

export async function addStudentToClassService(schoolId: string, classId: string, studentId: string) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')

  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')

  const alreadyLinked = await findClassStudentLinkRepository(classId, studentId)
  if (alreadyLinked) throw new Error('Student already in class')

  return addStudentToClassRepository(classId, studentId)
}

export async function removeStudentFromClassService(schoolId: string, classId: string, studentId: string) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')

  const link = await findClassStudentLinkRepository(classId, studentId)
  if (!link) throw new Error('Student not in class')

  await removeStudentFromClassRepository(classId, studentId)
}
