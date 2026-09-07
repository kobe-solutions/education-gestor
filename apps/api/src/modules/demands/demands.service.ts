import {
  findAllDemandsRepository,
  findDemandByIdRepository,
  createDemandRepository,
  updateDemandRepository,
  deleteDemandRepository,
} from './demands.repository'
import type { CreateDemandBody, UpdateDemandBody } from './demands.schema'

export async function listDemandsService(schoolId: string, opts?: { status?: string }) {
  return findAllDemandsRepository(schoolId, { status: opts?.status })
}

export async function getDemandService(id: string, schoolId: string) {
  const demand = await findDemandByIdRepository(id, schoolId)
  if (!demand) throw new Error('Demanda não encontrada')
  return demand
}

export async function createDemandService(data: CreateDemandBody, schoolId: string) {
  return createDemandRepository({ ...data, schoolId })
}

export async function updateDemandService(id: string, data: UpdateDemandBody, schoolId: string) {
  const existing = await findDemandByIdRepository(id, schoolId)
  if (!existing) throw new Error('Demanda não encontrada')
  return updateDemandRepository(id, schoolId, data)
}

export async function deleteDemandService(id: string, schoolId: string) {
  const existing = await findDemandByIdRepository(id, schoolId)
  if (!existing) throw new Error('Demanda não encontrada')
  return deleteDemandRepository(id, schoolId)
}
