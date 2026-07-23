import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createSubjectService,
  listSubjectsService,
  getSubjectService,
  updateSubjectService,
  deleteSubjectService,
} from '../../modules/subjects/subjects.service'
import * as repo from '../../modules/subjects/subjects.repository'

vi.mock('../../modules/subjects/subjects.repository')

const mockSubject = {
  id: 'subject-id',
  schoolId: 'school-id',
  name: 'Matemática',
  code: 'MAT',
  weeklyHours: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('createSubjectService', () => {
  it('cria disciplina quando nome e código são únicos', async () => {
    vi.mocked(repo.findSubjectByNameRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.findSubjectByCodeRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createSubjectRepository).mockResolvedValue(mockSubject)

    const result = await createSubjectService({
      schoolId: 'school-id',
      name: '  Matemática  ',
      code: 'MAT',
      weeklyHours: 5,
    })

    expect(result).toEqual(mockSubject)
    expect(repo.createSubjectRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Matemática', code: 'MAT' }),
    )
  })

  it('lança erro se nome já existe na escola', async () => {
    vi.mocked(repo.findSubjectByNameRepository).mockResolvedValue({ id: 'outro-id' })

    await expect(
      createSubjectService({ schoolId: 'school-id', name: 'Matemática', weeklyHours: 5 }),
    ).rejects.toThrow('Subject already exists with this name')

    expect(repo.createSubjectRepository).not.toHaveBeenCalled()
  })

  it('lança erro se código já existe na escola', async () => {
    vi.mocked(repo.findSubjectByNameRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.findSubjectByCodeRepository).mockResolvedValue({ id: 'outro-id' })

    await expect(
      createSubjectService({ schoolId: 'school-id', name: 'Nova Matéria', code: 'MAT', weeklyHours: 3 }),
    ).rejects.toThrow('Subject already exists with this code')

    expect(repo.createSubjectRepository).not.toHaveBeenCalled()
  })

  it('não verifica código se não fornecido', async () => {
    vi.mocked(repo.findSubjectByNameRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createSubjectRepository).mockResolvedValue({ ...mockSubject, code: null })

    await createSubjectService({ schoolId: 'school-id', name: 'Artes', weeklyHours: 2 })

    expect(repo.findSubjectByCodeRepository).not.toHaveBeenCalled()
  })

  it('normaliza código vazio para null', async () => {
    vi.mocked(repo.findSubjectByNameRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createSubjectRepository).mockResolvedValue({ ...mockSubject, code: null })

    await createSubjectService({ schoolId: 'school-id', name: 'Artes', code: '  ', weeklyHours: 2 })

    expect(repo.createSubjectRepository).toHaveBeenCalledWith(
      expect.objectContaining({ code: null }),
    )
  })
})

describe('listSubjectsService', () => {
  it('retorna disciplinas da escola', async () => {
    vi.mocked(repo.listSubjectsRepository).mockResolvedValue([mockSubject])

    const result = await listSubjectsService('school-id')

    expect(result).toHaveLength(1)
    expect(repo.listSubjectsRepository).toHaveBeenCalledWith('school-id')
  })
})

describe('getSubjectService', () => {
  it('retorna disciplina quando existe', async () => {
    vi.mocked(repo.findSubjectByIdRepository).mockResolvedValue(mockSubject)

    const result = await getSubjectService('school-id', 'subject-id')

    expect(result).toEqual(mockSubject)
  })

  it('lança erro quando disciplina não existe', async () => {
    vi.mocked(repo.findSubjectByIdRepository).mockResolvedValue(undefined as any)

    await expect(getSubjectService('school-id', 'nao-existe')).rejects.toThrow('Subject not found')
  })
})

describe('updateSubjectService', () => {
  it('atualiza disciplina quando existe', async () => {
    const updated = { ...mockSubject, name: 'Matemática Avançada' }
    vi.mocked(repo.findSubjectByIdRepository).mockResolvedValue(mockSubject)
    vi.mocked(repo.findSubjectByNameRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.updateSubjectRepository).mockResolvedValue(updated)

    const result = await updateSubjectService('school-id', 'subject-id', { name: 'Matemática Avançada' })

    expect(result.name).toBe('Matemática Avançada')
  })

  it('lança erro quando disciplina não existe', async () => {
    vi.mocked(repo.findSubjectByIdRepository).mockResolvedValue(undefined as any)

    await expect(
      updateSubjectService('school-id', 'nao-existe', { name: 'X' }),
    ).rejects.toThrow('Subject not found')
  })

  it('lança 409 se novo nome já pertence a outra disciplina', async () => {
    vi.mocked(repo.findSubjectByIdRepository).mockResolvedValue(mockSubject)
    vi.mocked(repo.findSubjectByNameRepository).mockResolvedValue({ id: 'outra-disciplina' })

    await expect(
      updateSubjectService('school-id', 'subject-id', { name: 'Português' }),
    ).rejects.toThrow('Subject already exists with this name')

    expect(repo.updateSubjectRepository).not.toHaveBeenCalled()
  })

  it('não verifica conflito de nome se o nome não mudou', async () => {
    vi.mocked(repo.findSubjectByIdRepository).mockResolvedValue(mockSubject)
    vi.mocked(repo.updateSubjectRepository).mockResolvedValue(mockSubject)

    await updateSubjectService('school-id', 'subject-id', { weeklyHours: 6 })

    expect(repo.findSubjectByNameRepository).not.toHaveBeenCalled()
  })
})

describe('deleteSubjectService', () => {
  it('deleta disciplina quando existe', async () => {
    vi.mocked(repo.findSubjectByIdRepository).mockResolvedValue(mockSubject)
    vi.mocked(repo.deleteSubjectRepository).mockResolvedValue(undefined as any)

    await expect(deleteSubjectService('school-id', 'subject-id')).resolves.not.toThrow()
    expect(repo.deleteSubjectRepository).toHaveBeenCalledWith('school-id', 'subject-id')
  })

  it('lança erro quando disciplina não existe', async () => {
    vi.mocked(repo.findSubjectByIdRepository).mockResolvedValue(undefined as any)

    await expect(deleteSubjectService('school-id', 'nao-existe')).rejects.toThrow('Subject not found')
    expect(repo.deleteSubjectRepository).not.toHaveBeenCalled()
  })
})
