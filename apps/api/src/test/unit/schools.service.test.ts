import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createSchoolService,
  listSchoolsService,
  getSchoolService,
  updateSchoolService,
  changeSchoolPasswordService,
  deleteSchoolService,
} from '../../modules/schools/schools.service'
import * as repo from '../../modules/schools/schools.repository'

vi.mock('../../modules/schools/schools.repository')

const mockSchool = {
  id: 'school-id',
  name: 'Escola Teste',
  slug: 'escola-teste',
  email: 'gestor@escola.com',
  director: null,
  coordinator: null,
  phone: null,
  address: null,
  createdAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('createSchoolService', () => {
  it('cria escola e linka à secretaria quando dados são válidos', async () => {
    vi.mocked(repo.findSchoolBySlugOrEmailRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createSchoolRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.linkSchoolToSecretariaRepository).mockResolvedValue(undefined)

    const result = await createSchoolService({
      name: '  Escola Teste  ',
      slug: 'Escola-Teste',
      email: 'GESTOR@ESCOLA.COM',
      password: 'senha12345',
      secretariaId: 'sec-id',
    })

    expect(result.role).toBe('gestor')
    expect(repo.createSchoolRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Escola Teste',
        slug: 'escola-teste',
        email: 'gestor@escola.com',
      }),
    )
    expect(repo.linkSchoolToSecretariaRepository).toHaveBeenCalledWith('school-id', 'sec-id')
  })

  it('lança erro se slug ou email já existe', async () => {
    vi.mocked(repo.findSchoolBySlugOrEmailRepository).mockResolvedValue({ id: 'outro-id' })

    await expect(
      createSchoolService({
        name: 'Outra Escola',
        slug: 'escola-teste',
        email: 'novo@email.com',
        password: 'senha12345',
        secretariaId: 'sec-id',
      }),
    ).rejects.toThrow('School already exists with this slug or email')

    expect(repo.createSchoolRepository).not.toHaveBeenCalled()
    expect(repo.linkSchoolToSecretariaRepository).not.toHaveBeenCalled()
  })

  it('normaliza nome, slug e email', async () => {
    vi.mocked(repo.findSchoolBySlugOrEmailRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createSchoolRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.linkSchoolToSecretariaRepository).mockResolvedValue(undefined)

    await createSchoolService({
      name: '  Escola ABC  ',
      slug: '  ESCOLA-ABC  ',
      email: '  GESTOR@ABC.COM  ',
      password: 'senha12345',
      secretariaId: 'sec-id',
    })

    expect(repo.createSchoolRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Escola ABC', slug: 'escola-abc', email: 'gestor@abc.com' }),
    )
  })

  it('armazena campos opcionais quando fornecidos', async () => {
    vi.mocked(repo.findSchoolBySlugOrEmailRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createSchoolRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.linkSchoolToSecretariaRepository).mockResolvedValue(undefined)

    await createSchoolService({
      name: 'Escola',
      slug: 'escola',
      email: 'e@e.com',
      password: 'senha12345',
      secretariaId: 'sec-id',
      director: '  João Silva  ',
      coordinator: '  Maria Santos  ',
    })

    expect(repo.createSchoolRepository).toHaveBeenCalledWith(
      expect.objectContaining({ director: 'João Silva', coordinator: 'Maria Santos' }),
    )
  })
})

describe('listSchoolsService', () => {
  it('retorna todas as escolas quando sem secretariaId', async () => {
    vi.mocked(repo.listSchoolsRepository).mockResolvedValue([mockSchool])

    const result = await listSchoolsService()

    expect(result).toHaveLength(1)
    expect(repo.listSchoolsRepository).toHaveBeenCalled()
    expect(repo.listSchoolsBySecretariaRepository).not.toHaveBeenCalled()
  })

  it('filtra por secretaria quando secretariaId fornecido', async () => {
    vi.mocked(repo.listSchoolsBySecretariaRepository).mockResolvedValue([mockSchool])

    const result = await listSchoolsService('sec-id')

    expect(result).toHaveLength(1)
    expect(repo.listSchoolsBySecretariaRepository).toHaveBeenCalledWith('sec-id')
    expect(repo.listSchoolsRepository).not.toHaveBeenCalled()
  })
})

describe('getSchoolService', () => {
  it('retorna escola quando existe', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)

    const result = await getSchoolService('school-id')

    expect(result).toEqual(mockSchool)
  })

  it('lança erro quando escola não existe', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(undefined)

    await expect(getSchoolService('nao-existe')).rejects.toThrow('School not found')
  })
})

describe('updateSchoolService', () => {
  it('atualiza escola quando admin é o solicitante', async () => {
    const updated = { ...mockSchool, name: 'Escola Atualizada' }
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.updateSchoolRepository).mockResolvedValue(updated)

    const result = await updateSchoolService('school-id', { name: 'Escola Atualizada' }, { role: 'admin' })

    expect(result.name).toBe('Escola Atualizada')
    expect(repo.isSchoolOwnedBySecretariaRepository).not.toHaveBeenCalled()
  })

  it('permite secretaria dona editar a escola', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.isSchoolOwnedBySecretariaRepository).mockResolvedValue(true)
    vi.mocked(repo.updateSchoolRepository).mockResolvedValue(mockSchool)

    await expect(
      updateSchoolService('school-id', { name: 'Novo Nome' }, { role: 'secretaria', secretariaId: 'sec-id' }),
    ).resolves.not.toThrow()

    expect(repo.isSchoolOwnedBySecretariaRepository).toHaveBeenCalledWith('school-id', 'sec-id')
  })

  it('lança Forbidden quando secretaria não é dona', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.isSchoolOwnedBySecretariaRepository).mockResolvedValue(false)

    await expect(
      updateSchoolService('school-id', { name: 'X' }, { role: 'secretaria', secretariaId: 'outra-sec' }),
    ).rejects.toThrow('Forbidden')

    expect(repo.updateSchoolRepository).not.toHaveBeenCalled()
  })

  it('lança erro quando escola não existe', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(undefined)

    await expect(
      updateSchoolService('nao-existe', { name: 'X' }, { role: 'admin' }),
    ).rejects.toThrow('School not found')
  })

  it('lança 409 se novo slug já pertence a outra escola', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.findSchoolBySlugOrEmailRepository).mockResolvedValue({ id: 'outra-escola' })

    await expect(
      updateSchoolService('school-id', { slug: 'slug-existente' }, { role: 'admin' }),
    ).rejects.toThrow('School already exists with this slug or email')
  })

  it('não faz checagem de conflito se slug não mudou', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.updateSchoolRepository).mockResolvedValue(mockSchool)

    await updateSchoolService('school-id', { name: 'Novo Nome' }, { role: 'admin' })

    expect(repo.findSchoolBySlugOrEmailRepository).not.toHaveBeenCalled()
  })
})

describe('deleteSchoolService', () => {
  it('deleta escola quando admin solicita', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.deleteSchoolRepository).mockResolvedValue(undefined)

    await expect(deleteSchoolService('school-id', { role: 'admin' })).resolves.not.toThrow()
    expect(repo.deleteSchoolRepository).toHaveBeenCalledWith('school-id')
  })

  it('lança Forbidden quando secretaria não é dona', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.isSchoolOwnedBySecretariaRepository).mockResolvedValue(false)

    await expect(
      deleteSchoolService('school-id', { role: 'secretaria', secretariaId: 'outra-sec' }),
    ).rejects.toThrow('Forbidden')

    expect(repo.deleteSchoolRepository).not.toHaveBeenCalled()
  })

  it('lança erro quando escola não existe', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(undefined)

    await expect(deleteSchoolService('nao-existe', { role: 'admin' })).rejects.toThrow('School not found')
  })
})

describe('changeSchoolPasswordService', () => {
  it('altera senha quando admin solicita', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.updateSchoolPasswordRepository).mockResolvedValue(undefined)

    await expect(
      changeSchoolPasswordService('school-id', 'novasenha123', { role: 'admin' }),
    ).resolves.not.toThrow()

    expect(repo.updateSchoolPasswordRepository).toHaveBeenCalledWith('school-id', expect.any(String))
  })

  it('lança Forbidden quando secretaria não é dona', async () => {
    vi.mocked(repo.findSchoolByIdRepository).mockResolvedValue(mockSchool)
    vi.mocked(repo.isSchoolOwnedBySecretariaRepository).mockResolvedValue(false)

    await expect(
      changeSchoolPasswordService('school-id', 'novasenha', { role: 'secretaria', secretariaId: 'outra' }),
    ).rejects.toThrow('Forbidden')

    expect(repo.updateSchoolPasswordRepository).not.toHaveBeenCalled()
  })
})
