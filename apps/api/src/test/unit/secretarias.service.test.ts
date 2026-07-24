import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createSecretariaService,
  addSchoolToSecretariaService,
  removeSchoolFromSecretariaService,
  listSchoolsBySecretariaService,
} from '../../modules/secretarias/secretarias.service'
import * as repo from '../../modules/secretarias/secretarias.repository'
import * as schoolRepo from '../../modules/schools/schools.repository'

vi.mock('../../modules/secretarias/secretarias.repository')
vi.mock('../../modules/schools/schools.repository')

const mockSecretaria = {
  id: 'sec-id',
  name: 'Rede ABC',
  email: 'rede@abc.com',
  passwordHash: '$2b$10$abcdefghijklmnopqrstuu',
  role: 'secretaria',
  phone: null as string | null,
  address: null as string | null,
  responsible: null as string | null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSchool = {
  id: 'school-id',
  name: 'Escola X',
  slug: 'escola-x',
  email: 'escola@x.com',
  passwordHash: '$2b$10$abcdefghijklmnopqrstuu',
  role: 'gestor',
  director: null as string | null,
  coordinator: null as string | null,
  phone: null as string | null,
  address: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null as Date | null,
}

const mockLink = {
  id: 'link-id',
  secretariaId: 'sec-id',
  schoolId: 'school-id',
  createdAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('createSecretariaService', () => {
  it('cria secretaria quando email é único', async () => {
    vi.mocked(repo.findSecretariaByEmailRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createSecretariaRepository).mockResolvedValue(mockSecretaria)

    const result = await createSecretariaService({
      name: 'Rede ABC',
      email: 'rede@abc.com',
      password: 'senha123!',
    })

    expect(result).toEqual(mockSecretaria)
  })

  it('lança erro se email já existe', async () => {
    vi.mocked(repo.findSecretariaByEmailRepository).mockResolvedValue(mockSecretaria as any)

    await expect(
      createSecretariaService({ name: 'X', email: 'rede@abc.com', password: 'senha123!' }),
    ).rejects.toThrow('Secretaria already exists with this email')

    expect(repo.createSecretariaRepository).not.toHaveBeenCalled()
  })

  it('normaliza email para minúsculas', async () => {
    vi.mocked(repo.findSecretariaByEmailRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createSecretariaRepository).mockResolvedValue(mockSecretaria)

    await createSecretariaService({ name: 'X', email: 'REDE@ABC.COM', password: 'senha123!' })

    expect(repo.findSecretariaByEmailRepository).toHaveBeenCalledWith('rede@abc.com')
  })
})

describe('addSchoolToSecretariaService', () => {
  it('vincula escola à secretaria', async () => {
    vi.mocked(repo.findSecretariaByIdRepository).mockResolvedValue(mockSecretaria as any)
    vi.mocked(schoolRepo.findSchoolByIdRepository).mockResolvedValue(mockSchool as any)
    vi.mocked(repo.findSecretariaSchoolLinkRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.addSchoolToSecretariaRepository).mockResolvedValue(mockLink)

    const result = await addSchoolToSecretariaService('sec-id', 'school-id')

    expect(result).toEqual(mockLink)
  })

  it('lança erro se secretaria não existe', async () => {
    vi.mocked(repo.findSecretariaByIdRepository).mockResolvedValue(undefined as any)

    await expect(addSchoolToSecretariaService('nao-existe', 'school-id')).rejects.toThrow(
      'Secretaria not found',
    )
  })

  it('lança erro se escola não existe', async () => {
    vi.mocked(repo.findSecretariaByIdRepository).mockResolvedValue(mockSecretaria as any)
    vi.mocked(schoolRepo.findSchoolByIdRepository).mockResolvedValue(undefined as any)

    await expect(addSchoolToSecretariaService('sec-id', 'nao-existe')).rejects.toThrow(
      'School not found',
    )
  })

  it('lança erro se escola já está vinculada', async () => {
    vi.mocked(repo.findSecretariaByIdRepository).mockResolvedValue(mockSecretaria as any)
    vi.mocked(schoolRepo.findSchoolByIdRepository).mockResolvedValue(mockSchool as any)
    vi.mocked(repo.findSecretariaSchoolLinkRepository).mockResolvedValue(mockLink as any)

    await expect(addSchoolToSecretariaService('sec-id', 'school-id')).rejects.toThrow(
      'School already linked to this secretaria',
    )
    expect(repo.addSchoolToSecretariaRepository).not.toHaveBeenCalled()
  })
})

describe('removeSchoolFromSecretariaService', () => {
  it('desvincula escola da secretaria', async () => {
    vi.mocked(repo.findSecretariaSchoolLinkRepository).mockResolvedValue(mockLink as any)
    vi.mocked(repo.removeSchoolFromSecretariaRepository).mockResolvedValue(undefined as any)

    await expect(removeSchoolFromSecretariaService('sec-id', 'school-id')).resolves.not.toThrow()
    expect(repo.removeSchoolFromSecretariaRepository).toHaveBeenCalledWith('sec-id', 'school-id')
  })

  it('lança erro se vínculo não existe', async () => {
    vi.mocked(repo.findSecretariaSchoolLinkRepository).mockResolvedValue(undefined as any)

    await expect(removeSchoolFromSecretariaService('sec-id', 'school-id')).rejects.toThrow(
      'School not linked to this secretaria',
    )
  })
})

describe('listSchoolsBySecretariaService', () => {
  it('retorna escolas da secretaria', async () => {
    vi.mocked(repo.findSecretariaByIdRepository).mockResolvedValue(mockSecretaria as any)
    vi.mocked(repo.findSchoolsBySecretariaIdRepository).mockResolvedValue([mockSchool as any])

    const result = await listSchoolsBySecretariaService('sec-id')

    expect(result).toHaveLength(1)
  })

  it('lança erro se secretaria não existe', async () => {
    vi.mocked(repo.findSecretariaByIdRepository).mockResolvedValue(undefined as any)

    await expect(listSchoolsBySecretariaService('nao-existe')).rejects.toThrow('Secretaria not found')
  })
})
