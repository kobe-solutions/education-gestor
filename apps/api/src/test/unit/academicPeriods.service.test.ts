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

const SCHOOL_ID = 'school-id'
const YEAR_ID = 'year-id'
const PERIOD_ID = 'period-id'

const mockPeriod = {
  id: PERIOD_ID,
  schoolId: SCHOOL_ID,
  academicYearId: YEAR_ID,
  name: '1º Bimestre',
  type: 'bimestre',
  order: 1,
  startDate: '2025-02-01',
  endDate: '2025-04-30',
  gradeClosingDate: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('listAcademicPeriodsService', () => {
  it('retorna períodos da escola', async () => {
    vi.mocked(repo.findAllAcademicPeriodsRepository).mockResolvedValue([mockPeriod])

    const result = await listAcademicPeriodsService(SCHOOL_ID, YEAR_ID)

    expect(result).toHaveLength(1)
    expect(repo.findAllAcademicPeriodsRepository).toHaveBeenCalledWith(SCHOOL_ID, YEAR_ID)
  })

  it('retorna lista vazia quando não há períodos', async () => {
    vi.mocked(repo.findAllAcademicPeriodsRepository).mockResolvedValue([])

    const result = await listAcademicPeriodsService(SCHOOL_ID, YEAR_ID)

    expect(result).toHaveLength(0)
  })
})

describe('getAcademicPeriodService', () => {
  it('retorna período quando existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)

    const result = await getAcademicPeriodService(SCHOOL_ID, YEAR_ID, PERIOD_ID)

    expect(result).toEqual(mockPeriod)
  })

  it('lança erro quando período não existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(undefined as any)

    await expect(getAcademicPeriodService(SCHOOL_ID, YEAR_ID, 'nao-existe')).rejects.toThrow(
      'Academic period not found',
    )
  })
})

describe('createAcademicPeriodService', () => {
  it('cria período com nome normalizado', async () => {
    vi.mocked(repo.createAcademicPeriodRepository).mockResolvedValue(mockPeriod)

    const result = await createAcademicPeriodService(SCHOOL_ID, YEAR_ID, {
      name: '  1º Bimestre  ',
      type: 'bimestre',
      order: 1,
      startDate: '2025-02-01',
      endDate: '2025-04-30',
    })

    expect(result).toEqual(mockPeriod)
    expect(repo.createAcademicPeriodRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: '1º Bimestre', schoolId: SCHOOL_ID, academicYearId: YEAR_ID }),
    )
  })
})

describe('updateAcademicPeriodService', () => {
  it('atualiza período quando existe', async () => {
    const updated = { ...mockPeriod, name: '2º Bimestre' }
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)
    vi.mocked(repo.updateAcademicPeriodRepository).mockResolvedValue(updated)

    const result = await updateAcademicPeriodService(SCHOOL_ID, YEAR_ID, PERIOD_ID, { name: '2º Bimestre' })

    expect(result.name).toBe('2º Bimestre')
  })

  it('lança erro na busca quando período não existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(undefined as any)

    await expect(
      updateAcademicPeriodService(SCHOOL_ID, YEAR_ID, 'nao-existe', { name: 'X' }),
    ).rejects.toThrow('Academic period not found')

    expect(repo.updateAcademicPeriodRepository).not.toHaveBeenCalled()
  })

  it('lança erro no update quando repositório retorna undefined', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)
    vi.mocked(repo.updateAcademicPeriodRepository).mockResolvedValue(undefined as any)

    await expect(
      updateAcademicPeriodService(SCHOOL_ID, YEAR_ID, PERIOD_ID, { name: 'X' }),
    ).rejects.toThrow('Academic period not found')
  })

  it('atualiza nome e datas individualmente', async () => {
    const updated = { ...mockPeriod, name: '2º Bimestre', startDate: '2025-05-01' }
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)
    vi.mocked(repo.updateAcademicPeriodRepository).mockResolvedValue(updated)

    const result = await updateAcademicPeriodService(SCHOOL_ID, YEAR_ID, PERIOD_ID, {
      name: '2º Bimestre',
      startDate: '2025-05-01',
    })

    expect(result.name).toBe('2º Bimestre')
    expect(repo.updateAcademicPeriodRepository).toHaveBeenCalledWith(
      SCHOOL_ID,
      YEAR_ID,
      PERIOD_ID,
      expect.objectContaining({ name: '2º Bimestre', startDate: '2025-05-01' }),
    )
  })
})

describe('deleteAcademicPeriodService', () => {
  it('deleta período quando existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(mockPeriod)
    vi.mocked(repo.deleteAcademicPeriodRepository).mockResolvedValue(undefined as any)

    await expect(deleteAcademicPeriodService(SCHOOL_ID, YEAR_ID, PERIOD_ID)).resolves.not.toThrow()
    expect(repo.deleteAcademicPeriodRepository).toHaveBeenCalledWith(SCHOOL_ID, YEAR_ID, PERIOD_ID)
  })

  it('lança erro quando período não existe', async () => {
    vi.mocked(repo.findAcademicPeriodByIdRepository).mockResolvedValue(undefined as any)

    await expect(deleteAcademicPeriodService(SCHOOL_ID, YEAR_ID, 'nao-existe')).rejects.toThrow(
      'Academic period not found',
    )
    expect(repo.deleteAcademicPeriodRepository).not.toHaveBeenCalled()
  })
})
