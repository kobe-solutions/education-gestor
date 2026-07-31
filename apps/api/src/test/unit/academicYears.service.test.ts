import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listAcademicYearsService,
  getAcademicYearService,
  getActiveAcademicYearService,
  createAcademicYearService,
  updateAcademicYearService,
  updateAcademicYearStatusService,
  deleteAcademicYearService,
} from '../../modules/academicYears/academicYears.service'
import * as repo from '../../modules/academicYears/academicYears.repository'

vi.mock('../../modules/academicYears/academicYears.repository')

const SCHOOL_ID = 'school-id'
const YEAR_ID = 'year-id'
const OTHER_YEAR_ID = 'other-year-id'

const mockYear = {
  id: YEAR_ID,
  schoolId: SCHOOL_ID,
  year: 2026,
  name: 'Ano Letivo 2026',
  startDate: '2026-02-01',
  endDate: '2026-12-20',
  registrationStart: '2026-01-01',
  registrationEnd: '2026-01-31',
  status: 'planning',
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('listAcademicYearsService', () => {
  it('retorna anos letivos da escola', async () => {
    vi.mocked(repo.findAllAcademicYearsRepository).mockResolvedValue([mockYear])

    const result = await listAcademicYearsService(SCHOOL_ID)

    expect(result).toHaveLength(1)
    expect(repo.findAllAcademicYearsRepository).toHaveBeenCalledWith(SCHOOL_ID)
  })
})

describe('getAcademicYearService', () => {
  it('retorna ano letivo quando existe', async () => {
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(mockYear)

    const result = await getAcademicYearService(SCHOOL_ID, YEAR_ID)

    expect(result).toEqual(mockYear)
  })

  it('lança erro quando ano letivo não existe', async () => {
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(undefined as any)

    await expect(getAcademicYearService(SCHOOL_ID, 'nao-existe')).rejects.toThrow(
      'Academic year not found',
    )
  })
})

describe('getActiveAcademicYearService', () => {
  it('retorna ano letivo ativo quando existe', async () => {
    vi.mocked(repo.findActiveAcademicYearRepository).mockResolvedValue({
      ...mockYear,
      status: 'active',
    })

    const result = await getActiveAcademicYearService(SCHOOL_ID)

    expect(result.status).toBe('active')
  })

  it('lança erro quando não há ano letivo ativo', async () => {
    vi.mocked(repo.findActiveAcademicYearRepository).mockResolvedValue(undefined as any)

    await expect(getActiveAcademicYearService(SCHOOL_ID)).rejects.toThrow('No active academic year')
  })
})

describe('createAcademicYearService', () => {
  it('cria ano letivo com nome normalizado', async () => {
    vi.mocked(repo.createAcademicYearRepository).mockResolvedValue(mockYear)

    const result = await createAcademicYearService(SCHOOL_ID, {
      year: 2026,
      name: '  Ano Letivo 2026  ',
      startDate: '2026-02-01',
      endDate: '2026-12-20',
    })

    expect(result).toEqual(mockYear)
    expect(repo.createAcademicYearRepository).toHaveBeenCalledWith(
      expect.objectContaining({ schoolId: SCHOOL_ID, name: 'Ano Letivo 2026' }),
    )
  })
})

describe('updateAcademicYearService', () => {
  it('atualiza ano letivo quando existe', async () => {
    const updated = { ...mockYear, name: 'Ano Letivo 2026.1' }
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(mockYear)
    vi.mocked(repo.updateAcademicYearRepository).mockResolvedValue(updated)

    const result = await updateAcademicYearService(SCHOOL_ID, YEAR_ID, { name: '  Ano Letivo 2026.1  ' })

    expect(result.name).toBe('Ano Letivo 2026.1')
    expect(repo.updateAcademicYearRepository).toHaveBeenCalledWith(
      SCHOOL_ID,
      YEAR_ID,
      expect.objectContaining({ name: 'Ano Letivo 2026.1' }),
    )
  })

  it('lança erro quando ano letivo não existe', async () => {
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(undefined as any)

    await expect(updateAcademicYearService(SCHOOL_ID, 'nao-existe', { name: 'X' })).rejects.toThrow(
      'Academic year not found',
    )

    expect(repo.updateAcademicYearRepository).not.toHaveBeenCalled()
  })
})

describe('updateAcademicYearStatusService', () => {
  it('ativa ano letivo quando não há outro ativo', async () => {
    const active = { ...mockYear, status: 'active' }
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(mockYear)
    vi.mocked(repo.findActiveAcademicYearRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.updateAcademicYearStatusRepository).mockResolvedValue(active)

    const result = await updateAcademicYearStatusService(SCHOOL_ID, YEAR_ID, 'active')

    expect(result.status).toBe('active')
    expect(repo.updateAcademicYearStatusRepository).toHaveBeenCalledWith(SCHOOL_ID, YEAR_ID, 'active')
  })

  it('lança conflito quando já existe outro ano letivo ativo', async () => {
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(mockYear)
    vi.mocked(repo.findActiveAcademicYearRepository).mockResolvedValue({
      ...mockYear,
      id: OTHER_YEAR_ID,
      status: 'active',
    })

    await expect(updateAcademicYearStatusService(SCHOOL_ID, YEAR_ID, 'active')).rejects.toThrow(
      'Já existe um ano letivo ativo nesta escola',
    )

    expect(repo.updateAcademicYearStatusRepository).not.toHaveBeenCalled()
  })

  it('não bloqueia atualização do próprio ano letivo ativo', async () => {
    const active = { ...mockYear, status: 'active' }
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(active)
    vi.mocked(repo.findActiveAcademicYearRepository).mockResolvedValue(active)
    vi.mocked(repo.updateAcademicYearStatusRepository).mockResolvedValue(active)

    const result = await updateAcademicYearStatusService(SCHOOL_ID, YEAR_ID, 'active')

    expect(result.status).toBe('active')
    expect(repo.updateAcademicYearStatusRepository).toHaveBeenCalledWith(SCHOOL_ID, YEAR_ID, 'active')
  })

  it('permite transição para closed mesmo com outro ano ativo', async () => {
    const closed = { ...mockYear, status: 'closed' }
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(mockYear)
    vi.mocked(repo.findActiveAcademicYearRepository).mockResolvedValue({
      ...mockYear,
      id: OTHER_YEAR_ID,
      status: 'active',
    })
    vi.mocked(repo.updateAcademicYearStatusRepository).mockResolvedValue(closed)

    const result = await updateAcademicYearStatusService(SCHOOL_ID, YEAR_ID, 'closed')

    expect(result.status).toBe('closed')
  })

  it('lança erro quando ano letivo não existe', async () => {
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(undefined as any)

    await expect(updateAcademicYearStatusService(SCHOOL_ID, 'nao-existe', 'active')).rejects.toThrow(
      'Academic year not found',
    )

    expect(repo.updateAcademicYearStatusRepository).not.toHaveBeenCalled()
  })
})

describe('deleteAcademicYearService', () => {
  it('deleta ano letivo não ativo', async () => {
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(mockYear)
    vi.mocked(repo.deleteAcademicYearRepository).mockResolvedValue(undefined as any)

    await expect(deleteAcademicYearService(SCHOOL_ID, YEAR_ID)).resolves.not.toThrow()
    expect(repo.deleteAcademicYearRepository).toHaveBeenCalledWith(SCHOOL_ID, YEAR_ID)
  })

  it('bloqueia exclusão de ano letivo ativo', async () => {
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue({
      ...mockYear,
      status: 'active',
    })

    await expect(deleteAcademicYearService(SCHOOL_ID, YEAR_ID)).rejects.toThrow(
      'Cannot delete an active academic year',
    )

    expect(repo.deleteAcademicYearRepository).not.toHaveBeenCalled()
  })

  it('lança erro quando ano letivo não existe', async () => {
    vi.mocked(repo.findAcademicYearByIdRepository).mockResolvedValue(undefined as any)

    await expect(deleteAcademicYearService(SCHOOL_ID, 'nao-existe')).rejects.toThrow(
      'Academic year not found',
    )
  })
})
