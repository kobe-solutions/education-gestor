import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listAcademicPeriodsService,
  getAcademicPeriodService,
  createAcademicPeriodService,
  updateAcademicPeriodService,
  deleteAcademicPeriodService,
} from '../../modules/academicPeriods/academicPeriods.service'
import * as repo from '../../modules/academicPeriods/academicPeriods.repository'

vi.mock('../../modules/academicPeriods/academicPeriods.repository')

const mockPeriod = {
  id: 'period-id',
  schoolId: 'school-id',
  name: '2025',
  startDate: '2025-02-01',
  endDate: '2025-12-15',
  active: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('listAcademicPeriodsService', () => {
  it('retorna períodos da escola', async () => {
    vi.mocked(repo.findAllAcademicPeriodsRepository).mockResolvedValue([mockPeriod])

    const result = await listAcademicPeriodsService('school-id')

    expect(result).toHaveLength(1)
    expect(repo.findAllAcademicPeriodsRepository).toHaveBeenCalledWith('school-id')
  })

  it('retorna lista vazia quando não há períodos', async () => {
    vi.mocked(repo.findAllAcademicPeriodsRepository).mockResolvedValue([])

    const result = await listAcademicPeriodsService('school-id')

    expect(result).toHaveLength(0)
  })
})

describe('getAcademicPeriodService', () => {
  it('retorna período quando existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)

    const result = await getAcademicPeriodService('school-id', 'period-id')

    expect(result).toEqual(mockPeriod)
  })

  it('lança erro quando período não existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(undefined)

    await expect(getAcademicPeriodService('school-id', 'nao-existe')).rejects.toThrow(
      'Academic period not found',
    )
  })
})

describe('createAcademicPeriodService', () => {
  it('cria período com nome normalizado', async () => {
    vi.mocked(repo.createAcademicPeriodRepository).mockResolvedValue(mockPeriod)

    const result = await createAcademicPeriodService({
      schoolId: 'school-id',
      name: '  2025  ',
      startDate: '2025-02-01',
      endDate: '2025-12-15',
    })

    expect(result).toEqual(mockPeriod)
    expect(repo.createAcademicPeriodRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: '2025', schoolId: 'school-id' }),
    )
  })
})

describe('updateAcademicPeriodService', () => {
  it('atualiza período quando existe', async () => {
    const updated = { ...mockPeriod, active: true }
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)
    vi.mocked(repo.updateAcademicPeriodRepository).mockResolvedValue(updated)

    const result = await updateAcademicPeriodService('school-id', 'period-id', { active: true })

    expect(result.active).toBe(true)
  })

  it('lança erro na busca quando período não existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(undefined)

    await expect(
      updateAcademicPeriodService('school-id', 'nao-existe', { active: true }),
    ).rejects.toThrow('Academic period not found')

    expect(repo.updateAcademicPeriodRepository).not.toHaveBeenCalled()
  })

  it('lança erro no update quando repositório retorna undefined', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)
    vi.mocked(repo.updateAcademicPeriodRepository).mockResolvedValue(undefined)

    await expect(
      updateAcademicPeriodService('school-id', 'period-id', { name: 'X' }),
    ).rejects.toThrow('Academic period not found')
  })

  it('atualiza nome, startDate e endDate individualmente', async () => {
    const updated = { ...mockPeriod, name: '2026', startDate: '2026-02-01' }
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)
    vi.mocked(repo.updateAcademicPeriodRepository).mockResolvedValue(updated)

    const result = await updateAcademicPeriodService('school-id', 'period-id', {
      name: '2026',
      startDate: '2026-02-01',
    })

    expect(result.name).toBe('2026')
    expect(repo.updateAcademicPeriodRepository).toHaveBeenCalledWith(
      'school-id',
      'period-id',
      expect.objectContaining({ name: '2026', startDate: '2026-02-01' }),
    )
  })
})

describe('deleteAcademicPeriodService', () => {
  it('deleta período quando existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)
    vi.mocked(repo.deleteAcademicPeriodRepository).mockResolvedValue(undefined)

    await expect(deleteAcademicPeriodService('school-id', 'period-id')).resolves.not.toThrow()
    expect(repo.deleteAcademicPeriodRepository).toHaveBeenCalledWith('school-id', 'period-id')
  })

  it('lança erro quando período não existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(undefined)

    await expect(deleteAcademicPeriodService('school-id', 'nao-existe')).rejects.toThrow(
      'Academic period not found',
    )
    expect(repo.deleteAcademicPeriodRepository).not.toHaveBeenCalled()
  })
})
