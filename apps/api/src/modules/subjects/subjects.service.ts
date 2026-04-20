import {
  createSubjectRepository,
  findSubjectByCodeRepository,
  findSubjectByNameRepository,
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
