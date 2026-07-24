import {
  createSerieRepository,
  findSerieByIdRepository,
  findSerieByNameInLevelRepository,
  listSeriesRepository,
  updateSerieRepository,
  deleteSerieRepository,
} from './series.repository'
import { findEducationLevelByIdRepository } from '../educationLevels/educationLevels.repository'

type CreateInput = {
  schoolId: string
  educationLevelId: string
  name: string
  order?: number
}

export async function createSerieService(input: CreateInput) {
  const normalizedName = input.name.trim()

  const level = await findEducationLevelByIdRepository(input.schoolId, input.educationLevelId)
  if (!level) throw new Error('Education level not found')

  const existing = await findSerieByNameInLevelRepository(
    input.schoolId,
    input.educationLevelId,
    normalizedName,
  )
  if (existing) throw new Error('Serie already exists with this name in this level')

  return createSerieRepository({ ...input, name: normalizedName })
}

export async function listSeriesService(schoolId: string, educationLevelId?: string) {
  return listSeriesRepository(schoolId, educationLevelId)
}

export async function getSerieService(schoolId: string, id: string) {
  const serie = await findSerieByIdRepository(schoolId, id)
  if (!serie) throw new Error('Serie not found')
  return serie
}

type UpdateInput = {
  name?: string
  order?: number
}

export async function updateSerieService(schoolId: string, id: string, data: UpdateInput) {
  const serie = await findSerieByIdRepository(schoolId, id)
  if (!serie) throw new Error('Serie not found')

  if (data.name && data.name.trim() !== serie.name) {
    const existing = await findSerieByNameInLevelRepository(
      schoolId,
      serie.educationLevelId,
      data.name.trim(),
    )
    if (existing) throw new Error('Serie already exists with this name in this level')
    data.name = data.name.trim()
  }

  return updateSerieRepository(schoolId, id, data)
}

export async function deleteSerieService(schoolId: string, id: string) {
  const serie = await findSerieByIdRepository(schoolId, id)
  if (!serie) throw new Error('Serie not found')
  await deleteSerieRepository(schoolId, id)
}
