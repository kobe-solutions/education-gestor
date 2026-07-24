import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scryptSync, randomBytes } from 'node:crypto'
import { authenticateService } from '../../modules/auth/auth.service'
import * as adminRepo from '../../modules/admins/admins.repository'
import * as secretariaRepo from '../../modules/secretarias/secretarias.repository'
import * as schoolRepo from '../../modules/schools/schools.repository'
import * as teacherRepo from '../../modules/teachers/teachers.repository'

vi.mock('../../modules/admins/admins.repository')
vi.mock('../../modules/secretarias/secretarias.repository')
vi.mock('../../modules/schools/schools.repository')
vi.mock('../../modules/teachers/teachers.repository')

function makeHash(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const VALID_HASH = makeHash('senha123!')
const WRONG_HASH = makeHash('outra-senha')

beforeEach(() => {
  vi.mocked(adminRepo.findAdminByEmailRepository).mockResolvedValue(undefined as any)
  vi.mocked(secretariaRepo.findSecretariaByEmailRepository).mockResolvedValue(undefined as any)
  vi.mocked(schoolRepo.findSchoolByEmailRepository).mockResolvedValue(undefined as any)
  vi.mocked(teacherRepo.findTeachersByEmailRepository).mockResolvedValue([])
})

describe('authenticateService', () => {
  it('autentica admin com credenciais corretas', async () => {
    vi.mocked(adminRepo.findAdminByEmailRepository).mockResolvedValue({
      id: 'admin-id',
      name: 'Admin',
      email: 'admin@test.com',
      passwordHash: VALID_HASH,
      role: 'admin',
    })

    const result = await authenticateService({ email: 'admin@test.com', password: 'senha123!' })

    expect(result).toEqual({ userId: 'admin-id', schoolId: 'admin-id', name: 'Admin', role: 'admin' })
  })

  it('autentica secretaria com credenciais corretas', async () => {
    vi.mocked(secretariaRepo.findSecretariaByEmailRepository).mockResolvedValue({
      id: 'sec-id',
      name: 'Secretaria',
      email: 'sec@test.com',
      passwordHash: VALID_HASH,
      role: 'secretaria',
    })

    const result = await authenticateService({ email: 'sec@test.com', password: 'senha123!' })

    expect(result).toEqual({ userId: 'sec-id', secretariaId: 'sec-id', name: 'Secretaria', role: 'secretaria' })
  })

  it('autentica gestor com credenciais corretas', async () => {
    vi.mocked(schoolRepo.findSchoolByEmailRepository).mockResolvedValue({
      id: 'school-id',
      name: 'Escola X',
      slug: 'escola-x',
      email: 'gestor@test.com',
      passwordHash: VALID_HASH,
    })

    const result = await authenticateService({ email: 'gestor@test.com', password: 'senha123!' })

    expect(result).toEqual({ userId: 'school-id', schoolId: 'school-id', name: 'Escola X', role: 'gestor' })
  })

  it('autentica professor com credenciais corretas', async () => {
    vi.mocked(teacherRepo.findTeachersByEmailRepository).mockResolvedValue([
      { id: 'prof-id', schoolId: 'school-id', name: 'Prof. João', email: 'prof@test.com', passwordHash: VALID_HASH, role: 'professor' } as any,
    ])

    const result = await authenticateService({ email: 'prof@test.com', password: 'senha123!' })

    expect(result).toEqual({ userId: 'prof-id', schoolId: 'school-id', name: 'Prof. João', role: 'professor' })
  })

  it('lança erro com senha errada', async () => {
    vi.mocked(schoolRepo.findSchoolByEmailRepository).mockResolvedValue({
      id: 'school-id',
      name: 'Escola X',
      slug: 'escola-x',
      email: 'gestor@test.com',
      passwordHash: WRONG_HASH,
    })

    await expect(
      authenticateService({ email: 'gestor@test.com', password: 'senha123!' }),
    ).rejects.toThrow('Invalid credentials')
  })

  it('lança erro com email inexistente', async () => {
    await expect(
      authenticateService({ email: 'naoexiste@test.com', password: 'senha123!' }),
    ).rejects.toThrow('Invalid credentials')
  })

  it('normaliza email para minúsculas', async () => {
    vi.mocked(adminRepo.findAdminByEmailRepository).mockResolvedValue({
      id: 'admin-id',
      name: 'Admin',
      email: 'admin@test.com',
      passwordHash: VALID_HASH,
      role: 'admin',
    })

    await authenticateService({ email: '  ADMIN@TEST.COM  ', password: 'senha123!' })

    expect(adminRepo.findAdminByEmailRepository).toHaveBeenCalledWith('admin@test.com')
  })

  it('prioriza admin sobre secretaria com mesmo email', async () => {
    vi.mocked(adminRepo.findAdminByEmailRepository).mockResolvedValue({
      id: 'admin-id',
      name: 'Admin',
      email: 'admin@test.com',
      passwordHash: VALID_HASH,
      role: 'admin',
    })
    vi.mocked(secretariaRepo.findSecretariaByEmailRepository).mockResolvedValue({
      id: 'sec-id',
      name: 'Secretaria',
      email: 'admin@test.com',
      passwordHash: VALID_HASH,
      role: 'secretaria',
    })

    const result = await authenticateService({ email: 'admin@test.com', password: 'senha123!' })

    expect(result.role).toBe('admin')
  })
})
