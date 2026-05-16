import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createEducationLevelService,
  listEducationLevelsService,
  getEducationLevelService,
  updateEducationLevelService,
  deleteEducationLevelService,
} from '../../modules/educationLevels/educationLevels.service'
import * as repo from '../../modules/educationLevels/educationLevels.repository'

vi.mock('../../modules/educationLevels/educationLevels.repository')

const mockLevel = {
  id: 'level-id',
  schoolId: 'school-id',
  type: 'fundamental_1',
  modality: null,
  name: 'Ensino Fundamental 1',
  active: true,
  createdAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('createEducationLevelService', () => {
  it('cria nível quando nome é único', async () => {
    vi.mocked(repo.findEducationLevelByNameRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createEducationLevelRepository).mockResolvedValue(mockLevel)

    const result = await createEducationLevelService({
      schoolId: 'school-id',
      type: 'fundamental_1',
      name: '  Ensino Fundamental 1  ',
    })

    expect(result).toEqual(mockLevel)
    expect(repo.createEducationLevelRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ensino Fundamental 1' }),
    )
  })

  it('lança erro se nome já existe na escola', async () => {
    vi.mocked(repo.findEducationLevelByNameRepository).mockResolvedValue({ id: 'outro-id' })

    await expect(
      createEducationLevelService({ schoolId: 'school-id', type: 'fundamental_1', name: 'Ensino Fundamental 1' }),
    ).rejects.toThrow('Education level already exists with this name')

    expect(repo.createEducationLevelRepository).not.toHaveBeenCalled()
  })

  it('cria com modalidade opcional', async () => {
    vi.mocked(repo.findEducationLevelByNameRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createEducationLevelRepository).mockResolvedValue({ ...mockLevel, modality: 'integral' })

    await createEducationLevelService({
      schoolId: 'school-id',
      type: 'fundamental_1',
      name: 'Fund. 1 Integral',
      modality: 'integral',
    })

    expect(repo.createEducationLevelRepository).toHaveBeenCalledWith(
      expect.objectContaining({ modality: 'integral' }),
    )
  })
})

describe('listEducationLevelsService', () => {
  it('retorna níveis da escola', async () => {
    vi.mocked(repo.listEducationLevelsRepository).mockResolvedValue([mockLevel])

    const result = await listEducationLevelsService('school-id')

    expect(result).toHaveLength(1)
    expect(repo.listEducationLevelsRepository).toHaveBeenCalledWith('school-id')
  })
})

describe('getEducationLevelService', () => {
  it('retorna nível quando existe', async () => {
    vi.mocked(repo.findEducationLevelByIdRepository).mockResolvedValue(mockLevel)

    const result = await getEducationLevelService('school-id', 'level-id')

    expect(result).toEqual(mockLevel)
  })

  it('lança erro quando nível não existe', async () => {
    vi.mocked(repo.findEducationLevelByIdRepository).mockResolvedValue(undefined)

    await expect(getEducationLevelService('school-id', 'nao-existe')).rejects.toThrow(
      'Education level not found',
    )
  })
})

describe('updateEducationLevelService', () => {
  it('atualiza quando existe', async () => {
    const updated = { ...mockLevel, name: 'Fund. 1 Atualizado' }
    vi.mocked(repo.findEducationLevelByIdRepository).mockResolvedValue(mockLevel)
    vi.mocked(repo.findEducationLevelByNameRepository).mockResolvedValue(undefined)
    vi.mocked(repo.updateEducationLevelRepository).mockResolvedValue(updated)

    const result = await updateEducationLevelService('school-id', 'level-id', { name: 'Fund. 1 Atualizado' })

    expect(result.name).toBe('Fund. 1 Atualizado')
  })

  it('lança erro quando não existe', async () => {
    vi.mocked(repo.findEducationLevelByIdRepository).mockResolvedValue(undefined)

    await expect(
      updateEducationLevelService('school-id', 'nao-existe', { name: 'X' }),
    ).rejects.toThrow('Education level not found')
  })

  it('lança 409 se novo nome já pertence a outro nível', async () => {
    vi.mocked(repo.findEducationLevelByIdRepository).mockResolvedValue(mockLevel)
    vi.mocked(repo.findEducationLevelByNameRepository).mockResolvedValue({ id: 'outro-level' })

    await expect(
      updateEducationLevelService('school-id', 'level-id', { name: 'Ensino Médio' }),
    ).rejects.toThrow('Education level already exists with this name')

    expect(repo.updateEducationLevelRepository).not.toHaveBeenCalled()
  })

  it('não verifica conflito de nome se o nome não mudou', async () => {
    vi.mocked(repo.findEducationLevelByIdRepository).mockResolvedValue(mockLevel)
    vi.mocked(repo.updateEducationLevelRepository).mockResolvedValue(mockLevel)

    await updateEducationLevelService('school-id', 'level-id', { active: false })

    expect(repo.findEducationLevelByNameRepository).not.toHaveBeenCalled()
  })
})

describe('deleteEducationLevelService', () => {
  it('deleta quando existe', async () => {
    vi.mocked(repo.findEducationLevelByIdRepository).mockResolvedValue(mockLevel)
    vi.mocked(repo.deleteEducationLevelRepository).mockResolvedValue(undefined)

    await expect(deleteEducationLevelService('school-id', 'level-id')).resolves.not.toThrow()
    expect(repo.deleteEducationLevelRepository).toHaveBeenCalledWith('school-id', 'level-id')
  })

  it('lança erro quando não existe', async () => {
    vi.mocked(repo.findEducationLevelByIdRepository).mockResolvedValue(undefined)

    await expect(deleteEducationLevelService('school-id', 'nao-existe')).rejects.toThrow(
      'Education level not found',
    )
    expect(repo.deleteEducationLevelRepository).not.toHaveBeenCalled()
  })
})
