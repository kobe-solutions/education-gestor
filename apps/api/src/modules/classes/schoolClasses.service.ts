import {
  findAllSchoolClassesRepository,
  findSchoolClassByIdRepository,
  createSchoolClassRepository,
  updateSchoolClassRepository,
  deleteSchoolClassRepository,
  addStudentToClassRepository,
  removeStudentFromClassRepository,
  findClassStudentLinkRepository,
  findStudentsByClassRepository,
  countStudentsByClassesRepository,
  findClassesByStudentRepository,
} from './schoolClasses.repository'
import { findDistinctTeachersByClassRepository } from '../timetable/timetable.repository'
import { findStudentByIdRepository } from '../students/students.repository'

type CreateSchoolClassServiceInput = {
  schoolId: string
  name: string
  shift: string
  serieId?: string
}

type UpdateSchoolClassServiceInput = {
  name?: string
  shift?: string
  serieId?: string | null
}

export async function listSchoolClassesService(schoolId: string) {
  const classes = await findAllSchoolClassesRepository(schoolId) as any[]
  if (classes.length === 0) return classes.map((c: any) => ({ ...c, studentCount: 0 }))
  const classIds = classes.map((c: any) => c.id)
  const counts = await countStudentsByClassesRepository(classIds)
  return classes.map((c: any) => ({ ...c, studentCount: counts[c.id] ?? 0 }))
}

export async function getSchoolClassService(schoolId: string, id: string) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, id)
  if (!schoolClass) throw new Error('Class not found')

  const [teachers, students] = await Promise.all([
    findDistinctTeachersByClassRepository(schoolId, id),
    findStudentsByClassRepository(id),
  ])

  return { ...schoolClass, teachers, students }
}

export async function createSchoolClassService(input: CreateSchoolClassServiceInput) {
  return createSchoolClassRepository({
    schoolId: input.schoolId,
    name: input.name.trim(),
    shift: input.shift,
    serieId: input.serieId ?? null,
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

export async function addStudentToClassService(schoolId: string, classId: string, studentId: string) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')

  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')

  const alreadyLinked = await findClassStudentLinkRepository(classId, studentId)
  if (alreadyLinked) throw new Error('Student already in class')

  const counts = await countStudentsByClassesRepository([classId])
  const enrolled = counts[classId] ?? 0
  const maxStudents = (schoolClass as any).maxStudents ?? 40
  if (enrolled >= maxStudents) throw new Error('Class is full')

  return addStudentToClassRepository(classId, studentId)
}

export async function removeStudentFromClassService(schoolId: string, classId: string, studentId: string) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')

  const link = await findClassStudentLinkRepository(classId, studentId)
  if (!link) throw new Error('Student not in class')

  await removeStudentFromClassRepository(classId, studentId)
}

export async function listStudentClassesService(schoolId: string, studentId: string) {
  return findClassesByStudentRepository(schoolId, studentId)
}
