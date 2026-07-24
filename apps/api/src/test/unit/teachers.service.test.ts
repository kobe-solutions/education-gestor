import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createTeacherService,
  getTeacherService,
  updateTeacherService,
  deleteTeacherService,
  listTeachersService,
} from '../../modules/teachers/teachers.service'
import * as repo from '../../modules/teachers/teachers.repository'

vi.mock('../../modules/teachers/teachers.repository')

const mockTeacher = {
  id: 'teacher-id',
  schoolId: 'school-id',
  email: 'ana@escola.com',
  passwordHash: '$2b$10$abcdefghijklmnopqrstuu',
  role: 'professor',
  name: 'Prof. Ana',
  cpf: null as string | null,
  rg: null as string | null,
  birthDate: null as string | null,
  sex: null as string | null,
  nationality: null as string | null,
  maritalStatus: null as string | null,
  photoUrl: null as string | null,
  phone: null as string | null,
  addressCep: null as string | null,
  addressStreet: null as string | null,
  addressNumber: null as string | null,
  addressComplement: null as string | null,
  addressNeighborhood: null as string | null,
  addressCity: null as string | null,
  addressState: null as string | null,
  position: null as string | null,
  contractType: null as string | null,
  workload: null as string | null,
  workShift: null as string | null,
  employmentStatus: 'ativo',
  educationLevel: null as string | null,
  degree: null as string | null,
  institution: null as string | null,
  professionalRegistry: null as string | null,
  bank: null as string | null,
  agency: null as string | null,
  accountNumber: null as string | null,
  accountType: null as string | null,
  pixKey: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null as Date | null,
  subjects: [] as { id: string; name: string; code: string | null }[],
}

beforeEach(() => vi.clearAllMocks())

describe('createTeacherService', () => {
  it('cria professor quando email é único na escola', async () => {
    vi.mocked(repo.findTeacherByEmailRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createTeacherRepository).mockResolvedValue(mockTeacher)

    const result = await createTeacherService('school-id', {
      name: 'Prof. Ana',
      email: 'ana@escola.com',
      password: 'senha123!',
    })

    expect(result).toEqual(mockTeacher)
    expect(repo.createTeacherRepository).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@escola.com', role: 'professor' }),
    )
  })

  it('lança erro se email já existe na escola', async () => {
    vi.mocked(repo.findTeacherByEmailRepository).mockResolvedValue({ id: 'existing' } as any)

    await expect(
      createTeacherService('school-id', { name: 'Novo', email: 'ana@escola.com', password: 'senha123!' }),
    ).rejects.toThrow('Teacher already exists with this email')

    expect(repo.createTeacherRepository).not.toHaveBeenCalled()
  })

  it('normaliza email para minúsculas', async () => {
    vi.mocked(repo.findTeacherByEmailRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createTeacherRepository).mockResolvedValue(mockTeacher)

    await createTeacherService('school-id', { name: 'Ana', email: 'ANA@ESCOLA.COM', password: '123456789' })

    expect(repo.findTeacherByEmailRepository).toHaveBeenCalledWith('school-id', 'ana@escola.com')
  })

  it('hash da senha não é armazenado em texto puro', async () => {
    vi.mocked(repo.findTeacherByEmailRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createTeacherRepository).mockResolvedValue(mockTeacher)

    await createTeacherService('school-id', { name: 'Ana', email: 'ana@escola.com', password: 'senha123!' })

    const callArgs = vi.mocked(repo.createTeacherRepository).mock.calls[0][0]
    expect(callArgs.passwordHash).not.toBe('senha123!')
    expect(callArgs.passwordHash).toContain(':')
  })
})

describe('getTeacherService', () => {
  it('retorna professor quando existe', async () => {
    vi.mocked(repo.findTeacherByIdRepository).mockResolvedValue(mockTeacher)

    const result = await getTeacherService('school-id', 'teacher-id')

    expect(result).toEqual(mockTeacher)
  })

  it('lança erro se professor não existe', async () => {
    vi.mocked(repo.findTeacherByIdRepository).mockResolvedValue(undefined as any)

    await expect(getTeacherService('school-id', 'nao-existe')).rejects.toThrow('Teacher not found')
  })
})

describe('updateTeacherService', () => {
  it('atualiza professor quando existe', async () => {
    const updated = { ...mockTeacher, name: 'Prof. Ana Maria' }
    vi.mocked(repo.findTeacherByIdRepository).mockResolvedValue(mockTeacher)
    vi.mocked(repo.updateTeacherRepository).mockResolvedValue(updated)

    const result = await updateTeacherService('school-id', 'teacher-id', { name: 'Prof. Ana Maria' })

    expect(result.name).toBe('Prof. Ana Maria')
  })

  it('lança erro se professor não existe', async () => {
    vi.mocked(repo.findTeacherByIdRepository).mockResolvedValue(undefined as any)

    await expect(
      updateTeacherService('school-id', 'nao-existe', { name: 'X' }),
    ).rejects.toThrow('Teacher not found')
  })
})

describe('deleteTeacherService', () => {
  it('deleta professor quando existe', async () => {
    vi.mocked(repo.findTeacherByIdRepository).mockResolvedValue(mockTeacher)
    vi.mocked(repo.deleteTeacherRepository).mockResolvedValue(undefined as any)

    await expect(deleteTeacherService('school-id', 'teacher-id')).resolves.not.toThrow()
    expect(repo.deleteTeacherRepository).toHaveBeenCalledWith('school-id', 'teacher-id')
  })

  it('lança erro se professor não existe', async () => {
    vi.mocked(repo.findTeacherByIdRepository).mockResolvedValue(undefined as any)

    await expect(deleteTeacherService('school-id', 'nao-existe')).rejects.toThrow('Teacher not found')
    expect(repo.deleteTeacherRepository).not.toHaveBeenCalled()
  })
})

describe('listTeachersService', () => {
  it('retorna lista de professores da escola', async () => {
    vi.mocked(repo.findAllTeachersRepository).mockResolvedValue({ data: [mockTeacher], total: 1 })

    const result = await listTeachersService('school-id')

    expect(result.data).toHaveLength(1)
    expect(repo.findAllTeachersRepository).toHaveBeenCalledWith('school-id', {})
  })
})
