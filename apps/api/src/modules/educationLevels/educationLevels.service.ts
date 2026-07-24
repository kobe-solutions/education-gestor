import {
  createEducationLevelRepository,
  findEducationLevelByIdRepository,
  findEducationLevelByNameRepository,
  listEducationLevelsRepository,
  updateEducationLevelRepository,
  deleteEducationLevelRepository,
} from './educationLevels.repository'

type CreateInput = {
  schoolId: string
  type: string
  modality?: string
  name: string
  active?: boolean
}

export async function createEducationLevelService(input: CreateInput) {
  const normalizedName = input.name.trim()

  const existing = await findEducationLevelByNameRepository(input.schoolId, normalizedName)
  if (existing) throw new Error('Education level already exists with this name')

  return createEducationLevelRepository({ ...input, name: normalizedName })
}

export async function listEducationLevelsService(schoolId: string) {
  return listEducationLevelsRepository(schoolId)
}

export async function getEducationLevelService(schoolId: string, id: string) {
  const level = await findEducationLevelByIdRepository(schoolId, id)
  if (!level) throw new Error('Education level not found')
  return level
}

type UpdateInput = {
  type?: string
  modality?: string | null
  name?: string
  active?: boolean
}

export async function updateEducationLevelService(schoolId: string, id: string, data: UpdateInput) {
  const level = await findEducationLevelByIdRepository(schoolId, id)
  if (!level) throw new Error('Education level not found')

  if (data.name && data.name.trim() !== level.name) {
    const existing = await findEducationLevelByNameRepository(schoolId, data.name.trim())
    if (existing) throw new Error('Education level already exists with this name')
    data.name = data.name.trim()
  }

  return updateEducationLevelRepository(schoolId, id, data)
}

export async function deleteEducationLevelService(schoolId: string, id: string) {
  const level = await findEducationLevelByIdRepository(schoolId, id)
  if (!level) throw new Error('Education level not found')
  await deleteEducationLevelRepository(schoolId, id)
}
