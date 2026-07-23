import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createSerieService,
  listSeriesService,
  getSerieService,
  updateSerieService,
  deleteSerieService,
} from '../../modules/series/series.service'
import * as repo from '../../modules/series/series.repository'
import * as levelRepo from '../../modules/educationLevels/educationLevels.repository'

vi.mock('../../modules/series/series.repository')
vi.mock('../../modules/educationLevels/educationLevels.repository')

const mockLevel = {
  id: 'level-id',
  schoolId: 'school-id',
  type: 'fundamental_1',
  modality: null as string | null,
  name: 'Ensino Fundamental 1',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSerie = {
  id: 'serie-id',
  schoolId: 'school-id',
  educationLevelId: 'level-id',
  name: '1º ano',
  order: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  educationLevel: { id: 'level-id', name: 'Ensino Fundamental 1', type: 'fundamental_1' },
}

beforeEach(() => vi.clearAllMocks())

describe('createSerieService', () => {
  it('cria série quando nível existe e nome é único no nível', async () => {
    vi.mocked(levelRepo.findEducationLevelByIdRepository).mockResolvedValue(mockLevel)
    vi.mocked(repo.findSerieByNameInLevelRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createSerieRepository).mockResolvedValue(mockSerie)

    const result = await createSerieService({
      schoolId: 'school-id',
      educationLevelId: 'level-id',
      name: '  1º ano  ',
      order: 1,
    })

    expect(result).toEqual(mockSerie)
    expect(repo.createSerieRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: '1º ano' }),
    )
  })

  it('lança erro se nível de ensino não existe', async () => {
    vi.mocked(levelRepo.findEducationLevelByIdRepository).mockResolvedValue(undefined as any)

    await expect(
      createSerieService({ schoolId: 'school-id', educationLevelId: 'nao-existe', name: '1º ano' }),
    ).rejects.toThrow('Education level not found')

    expect(repo.createSerieRepository).not.toHaveBeenCalled()
  })

  it('lança erro se nome já existe no mesmo nível', async () => {
    vi.mocked(levelRepo.findEducationLevelByIdRepository).mockResolvedValue(mockLevel)
    vi.mocked(repo.findSerieByNameInLevelRepository).mockResolvedValue({ id: 'outro-id' })

    await expect(
      createSerieService({ schoolId: 'school-id', educationLevelId: 'level-id', name: '1º ano' }),
    ).rejects.toThrow('Serie already exists with this name in this level')

    expect(repo.createSerieRepository).not.toHaveBeenCalled()
  })

  it('permite mesmo nome em níveis diferentes', async () => {
    vi.mocked(levelRepo.findEducationLevelByIdRepository).mockResolvedValue(mockLevel)
    vi.mocked(repo.findSerieByNameInLevelRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createSerieRepository).mockResolvedValue(mockSerie)

    await createSerieService({ schoolId: 'school-id', educationLevelId: 'level-id-2', name: '1º ano' })

    expect(repo.createSerieRepository).toHaveBeenCalled()
  })
})

describe('listSeriesService', () => {
  it('lista séries da escola', async () => {
    vi.mocked(repo.listSeriesRepository).mockResolvedValue([mockSerie])

    const result = await listSeriesService('school-id')

    expect(result).toHaveLength(1)
    expect(repo.listSeriesRepository).toHaveBeenCalledWith('school-id', undefined)
  })

  it('filtra por nível de ensino quando fornecido', async () => {
    vi.mocked(repo.listSeriesRepository).mockResolvedValue([mockSerie])

    await listSeriesService('school-id', 'level-id')

    expect(repo.listSeriesRepository).toHaveBeenCalledWith('school-id', 'level-id')
  })
})

describe('getSerieService', () => {
  it('retorna série quando existe', async () => {
    vi.mocked(repo.findSerieByIdRepository).mockResolvedValue(mockSerie)

    const result = await getSerieService('school-id', 'serie-id')

    expect(result).toEqual(mockSerie)
  })

  it('lança erro quando série não existe', async () => {
    vi.mocked(repo.findSerieByIdRepository).mockResolvedValue(undefined as any)

    await expect(getSerieService('school-id', 'nao-existe')).rejects.toThrow('Serie not found')
  })
})

describe('updateSerieService', () => {
  it('atualiza quando existe', async () => {
    const updated = { ...mockSerie, name: '1º ano (atualizado)' }
    vi.mocked(repo.findSerieByIdRepository).mockResolvedValue(mockSerie)
    vi.mocked(repo.findSerieByNameInLevelRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.updateSerieRepository).mockResolvedValue(updated)

    const result = await updateSerieService('school-id', 'serie-id', { name: '1º ano (atualizado)' })

    expect(result.name).toBe('1º ano (atualizado)')
  })

  it('lança erro quando não existe', async () => {
    vi.mocked(repo.findSerieByIdRepository).mockResolvedValue(undefined as any)

    await expect(updateSerieService('school-id', 'nao-existe', { name: 'X' })).rejects.toThrow(
      'Serie not found',
    )
  })

  it('lança 409 se novo nome já existe no mesmo nível', async () => {
    vi.mocked(repo.findSerieByIdRepository).mockResolvedValue(mockSerie)
    vi.mocked(repo.findSerieByNameInLevelRepository).mockResolvedValue({ id: 'outra-serie' })

    await expect(
      updateSerieService('school-id', 'serie-id', { name: '2º ano' }),
    ).rejects.toThrow('Serie already exists with this name in this level')

    expect(repo.updateSerieRepository).not.toHaveBeenCalled()
  })
})

describe('deleteSerieService', () => {
  it('deleta quando existe', async () => {
    vi.mocked(repo.findSerieByIdRepository).mockResolvedValue(mockSerie)
    vi.mocked(repo.deleteSerieRepository).mockResolvedValue(undefined as any)

    await expect(deleteSerieService('school-id', 'serie-id')).resolves.not.toThrow()
    expect(repo.deleteSerieRepository).toHaveBeenCalledWith('school-id', 'serie-id')
  })

  it('lança erro quando não existe', async () => {
    vi.mocked(repo.findSerieByIdRepository).mockResolvedValue(undefined as any)

    await expect(deleteSerieService('school-id', 'nao-existe')).rejects.toThrow('Serie not found')
    expect(repo.deleteSerieRepository).not.toHaveBeenCalled()
  })
})
