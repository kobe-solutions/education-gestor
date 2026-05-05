import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createStudentService,
  getStudentService,
  updateStudentService,
  deleteStudentService,
  addGuardianService,
  listGuardiansService,
} from '../../modules/students/students.service'
import * as repo from '../../modules/students/students.repository'

vi.mock('../../modules/students/students.repository')

const mockStudent = {
  id: 'student-id',
  schoolId: 'school-id',
  name: 'João Silva',
  email: 'joao@test.com',
  birthDate: '2005-03-15',
  enrollmentCode: 'MAT001',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockGuardian = {
  id: 'guardian-id',
  studentId: 'student-id',
  name: 'Maria Silva',
  phone: '11999999999',
  relationship: 'mãe',
  createdAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('createStudentService', () => {
  it('cria aluno quando matrícula é única', async () => {
    vi.mocked(repo.findStudentByEnrollmentCodeRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createStudentRepository).mockResolvedValue(mockStudent)

    const result = await createStudentService({
      schoolId: 'school-id',
      name: '  João Silva  ',
      enrollmentCode: 'MAT001',
    })

    expect(result).toEqual(mockStudent)
    expect(repo.createStudentRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João Silva', enrollmentCode: 'MAT001' }),
    )
  })

  it('lança erro se matrícula já existe', async () => {
    vi.mocked(repo.findStudentByEnrollmentCodeRepository).mockResolvedValue({ id: 'existing' })

    await expect(
      createStudentService({ schoolId: 'school-id', name: 'Novo', enrollmentCode: 'MAT001' }),
    ).rejects.toThrow('Enrollment code already in use')

    expect(repo.createStudentRepository).not.toHaveBeenCalled()
  })

  it('normaliza email para minúsculas', async () => {
    vi.mocked(repo.findStudentByEnrollmentCodeRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createStudentRepository).mockResolvedValue(mockStudent)

    await createStudentService({
      schoolId: 'school-id',
      name: 'Test',
      enrollmentCode: 'MAT002',
      email: 'JOAO@TEST.COM',
    })

    expect(repo.createStudentRepository).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'joao@test.com' }),
    )
  })
})

describe('getStudentService', () => {
  it('retorna aluno quando existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)

    const result = await getStudentService('school-id', 'student-id')

    expect(result).toEqual(mockStudent)
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined)

    await expect(getStudentService('school-id', 'nao-existe')).rejects.toThrow('Student not found')
  })
})

describe('updateStudentService', () => {
  it('atualiza aluno quando existe', async () => {
    const updated = { ...mockStudent, name: 'João Atualizado' }
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.updateStudentRepository).mockResolvedValue(updated)

    const result = await updateStudentService('school-id', 'student-id', { name: 'João Atualizado' })

    expect(result.name).toBe('João Atualizado')
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined)

    await expect(
      updateStudentService('school-id', 'nao-existe', { name: 'X' }),
    ).rejects.toThrow('Student not found')
  })

  it('lança erro se nova matrícula já pertence a outro aluno', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findStudentByEnrollmentCodeRepository).mockResolvedValue({ id: 'outro-aluno' })

    await expect(
      updateStudentService('school-id', 'student-id', { enrollmentCode: 'MAT999' }),
    ).rejects.toThrow('Enrollment code already in use')
  })

  it('permite manter a própria matrícula sem conflito', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.updateStudentRepository).mockResolvedValue(mockStudent)

    // Mesma matrícula → findStudentByEnrollmentCodeRepository não deve ser chamado
    await updateStudentService('school-id', 'student-id', { enrollmentCode: 'MAT001' })

    expect(repo.findStudentByEnrollmentCodeRepository).not.toHaveBeenCalled()
  })
})

describe('deleteStudentService', () => {
  it('deleta aluno quando existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.deleteStudentRepository).mockResolvedValue(undefined)

    await expect(deleteStudentService('school-id', 'student-id')).resolves.not.toThrow()
    expect(repo.deleteStudentRepository).toHaveBeenCalledWith('school-id', 'student-id')
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined)

    await expect(deleteStudentService('school-id', 'nao-existe')).rejects.toThrow('Student not found')
    expect(repo.deleteStudentRepository).not.toHaveBeenCalled()
  })
})

describe('addGuardianService', () => {
  it('adiciona responsável a aluno existente', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.createGuardianRepository).mockResolvedValue(mockGuardian)

    const result = await addGuardianService({
      studentId: 'student-id',
      schoolId: 'school-id',
      name: 'Maria Silva',
      relationship: 'mãe',
    })

    expect(result).toEqual(mockGuardian)
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined)

    await expect(
      addGuardianService({ studentId: 'nao-existe', schoolId: 'school-id', name: 'X', relationship: 'pai' }),
    ).rejects.toThrow('Student not found')
  })
})

describe('listGuardiansService', () => {
  it('retorna responsáveis do aluno', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findGuardiansByStudentIdRepository).mockResolvedValue([mockGuardian])

    const result = await listGuardiansService('school-id', 'student-id')

    expect(result).toHaveLength(1)
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined)

    await expect(listGuardiansService('school-id', 'nao-existe')).rejects.toThrow('Student not found')
  })
})
