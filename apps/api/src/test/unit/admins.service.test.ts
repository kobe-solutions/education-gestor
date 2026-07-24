import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAdminService } from '../../modules/admins/admins.service'
import * as repo from '../../modules/admins/admins.repository'

vi.mock('../../modules/admins/admins.repository')

const mockAdmin = {
  id: 'admin-id',
  name: 'Admin Master',
  email: 'admin@test.com',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('createAdminService', () => {
  it('cria admin quando email é único', async () => {
    vi.mocked(repo.findAdminByEmailRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createAdminRepository).mockResolvedValue(mockAdmin)

    const result = await createAdminService({ name: 'Admin Master', email: 'admin@test.com', password: 'senha123!' })

    expect(result).toEqual(mockAdmin)
    expect(repo.createAdminRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Admin Master', email: 'admin@test.com' }),
    )
  })

  it('lança erro se email já existe', async () => {
    vi.mocked(repo.findAdminByEmailRepository).mockResolvedValue({ id: 'existing', name: 'Existing', email: 'admin@test.com', passwordHash: 'hash', role: 'admin' } as any)

    await expect(
      createAdminService({ name: 'Novo', email: 'admin@test.com', password: 'senha123!' }),
    ).rejects.toThrow('Admin already exists with this email')

    expect(repo.createAdminRepository).not.toHaveBeenCalled()
  })

  it('normaliza email para minúsculas', async () => {
    vi.mocked(repo.findAdminByEmailRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createAdminRepository).mockResolvedValue(mockAdmin)

    await createAdminService({ name: 'Admin', email: '  ADMIN@TEST.COM  ', password: 'senha123!' })

    expect(repo.findAdminByEmailRepository).toHaveBeenCalledWith('admin@test.com')
    expect(repo.createAdminRepository).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'admin@test.com' }),
    )
  })

  it('remove espaços do nome', async () => {
    vi.mocked(repo.findAdminByEmailRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createAdminRepository).mockResolvedValue(mockAdmin)

    await createAdminService({ name: '  Admin Master  ', email: 'admin@test.com', password: 'senha123!' })

    expect(repo.createAdminRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Admin Master' }),
    )
  })

  it('senha é armazenada como hash, não em texto puro', async () => {
    vi.mocked(repo.findAdminByEmailRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createAdminRepository).mockResolvedValue(mockAdmin)

    await createAdminService({ name: 'Admin', email: 'admin@test.com', password: 'senha123!' })

    const callArgs = vi.mocked(repo.createAdminRepository).mock.calls[0][0]
    expect(callArgs.passwordHash).not.toBe('senha123!')
    expect(callArgs.passwordHash).toContain(':')
  })
})
