import {
  createSubjectRepository,
  findSubjectByCodeRepository,
  findSubjectByNameRepository,
  listSubjectsRepository,
  findSubjectByIdRepository,
  updateSubjectRepository,
  deleteSubjectRepository,
} from './subjects.repository'

type CreateSubjectServiceInput = {
  schoolId: string
  name: string
  code?: string
  weeklyHours: number
}

export async function createSubjectService(input: CreateSubjectServiceInput) {
  const normalizedName = input.name.trim()
  const normalizedCode = input.code?.trim() || null

  const subjectNameAlreadyExists = await findSubjectByNameRepository(input.schoolId, normalizedName)
  if (subjectNameAlreadyExists) {
    throw new Error('Subject already exists with this name')
  }

  if (normalizedCode) {
    const subjectCodeAlreadyExists = await findSubjectByCodeRepository(input.schoolId, normalizedCode)
    if (subjectCodeAlreadyExists) {
      throw new Error('Subject already exists with this code')
    }
  }

  const subject = await createSubjectRepository({
    schoolId: input.schoolId,
    name: normalizedName,
    code: normalizedCode,
    weeklyHours: input.weeklyHours,
  })

  return subject
}

export async function listSubjectsService(schoolId: string) {
  return listSubjectsRepository(schoolId)
}

export async function getSubjectService(schoolId: string, id: string) {
  const subject = await findSubjectByIdRepository(schoolId, id)
  if (!subject) throw new Error('Subject not found')
  return subject
}

type UpdateSubjectServiceInput = {
  name?: string
  code?: string | null
  weeklyHours?: number
}

export async function updateSubjectService(schoolId: string, id: string, data: UpdateSubjectServiceInput) {
  const subject = await findSubjectByIdRepository(schoolId, id)
  if (!subject) throw new Error('Subject not found')

  if (data.name && data.name.trim() !== subject.name) {
    const existing = await findSubjectByNameRepository(schoolId, data.name.trim())
    if (existing) throw new Error('Subject already exists with this name')
    data.name = data.name.trim()
  }

  return updateSubjectRepository(schoolId, id, data)
}

export async function deleteSubjectService(schoolId: string, id: string) {
  const subject = await findSubjectByIdRepository(schoolId, id)
  if (!subject) throw new Error('Subject not found')
  await deleteSubjectRepository(schoolId, id)
}
