import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createStudentService,
  getStudentService,
  updateStudentService,
  deleteStudentService,
  addGuardianService,
  listGuardiansService,
  getMedicalService,
  upsertMedicalService,
  listDocumentsService,
} from '../../modules/students/students.service'
import * as repo from '../../modules/students/students.repository'
import * as storage from '../../lib/storage'

vi.mock('../../modules/students/students.repository')
vi.mock('../../lib/storage')

const mockStudent = {
  id: 'student-id',
  schoolId: 'school-id',
  name: 'João Silva',
  email: 'joao@test.com',
  cpf: null as string | null,
  rg: null as string | null,
  birthDate: '2005-03-15',
  sex: null as string | null,
  bloodType: null as string | null,
  naturalidade: null as string | null,
  photoUrl: null as string | null,
  phone: null as string | null,
  motherName: null as string | null,
  fatherName: null as string | null,
  motherPhone: null as string | null,
  addressCep: null as string | null,
  addressStreet: null as string | null,
  addressNumber: null as string | null,
  addressComplement: null as string | null,
  addressNeighborhood: null as string | null,
  addressCity: null as string | null,
  addressState: null as string | null,
  comorbidities: null as string | null,
  observations: null as string | null,
  enrollmentCode: '20250001',
  internalCode: null as string | null,
  enrollmentStatus: 'active',
  enrollmentDate: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null as Date | null,
}

const mockGuardian = {
  id: 'guardian-id',
  studentId: 'student-id',
  name: 'Maria Silva',
  email: null as string | null,
  phone: '11999999999',
  cpf: null as string | null,
  profession: null as string | null,
  relationship: 'mãe',
  isResponsible: true,
  isAuthorizedPickup: true,
  createdAt: new Date(),
  deletedAt: null as Date | null,
}

const mockMedical = {
  id: 'medical-id',
  schoolId: 'school-id',
  studentId: 'student-id',
  allergies: 'Penicilina',
  medications: null,
  foodRestrictions: null,
  diseases: null,
  medicalContact: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('createStudentService', () => {
  it('cria aluno e gera código de matrícula automaticamente', async () => {
    vi.mocked(repo.generateEnrollmentCodeRepository).mockResolvedValue('20250001')
    vi.mocked(repo.createStudentRepository).mockResolvedValue(mockStudent)

    const result = await createStudentService('school-id', { name: '  João Silva  ' })

    expect(result).toEqual(mockStudent)
    expect(repo.createStudentRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João Silva', enrollmentCode: '20250001', schoolId: 'school-id' }),
    )
  })

  it('normaliza email para minúsculas', async () => {
    vi.mocked(repo.generateEnrollmentCodeRepository).mockResolvedValue('20250001')
    vi.mocked(repo.createStudentRepository).mockResolvedValue(mockStudent)

    await createStudentService('school-id', { name: 'Test', email: 'JOAO@TEST.COM' })

    expect(repo.createStudentRepository).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'joao@test.com' }),
    )
  })

  it('define data de matrícula como hoje se não informada', async () => {
    vi.mocked(repo.generateEnrollmentCodeRepository).mockResolvedValue('20250001')
    vi.mocked(repo.createStudentRepository).mockResolvedValue(mockStudent)

    await createStudentService('school-id', { name: 'Test' })

    const callArgs = vi.mocked(repo.createStudentRepository).mock.calls[0][0]
    expect(callArgs.enrollmentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('getStudentService', () => {
  it('retorna aluno quando existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)

    const result = await getStudentService('school-id', 'student-id')

    expect(result).toEqual(mockStudent)
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined as any)

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
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined as any)

    await expect(
      updateStudentService('school-id', 'nao-existe', { name: 'X' }),
    ).rejects.toThrow('Student not found')
  })
})

describe('deleteStudentService', () => {
  it('deleta aluno sem foto', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)

    await expect(deleteStudentService('school-id', 'student-id')).resolves.not.toThrow()
    expect(repo.deleteStudentRepository).toHaveBeenCalledWith('school-id', 'student-id')
  })

  it('deleta foto no storage ao remover aluno', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue({ ...mockStudent, photoUrl: 'https://s3.example.com/photo.jpg' })
    vi.mocked(storage.extractKeyFromUrl).mockReturnValue('photo.jpg')
    vi.mocked(storage.deleteFile).mockResolvedValue(undefined as any)

    await deleteStudentService('school-id', 'student-id')

    expect(storage.deleteFile).toHaveBeenCalledWith('photo.jpg')
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined as any)

    await expect(deleteStudentService('school-id', 'nao-existe')).rejects.toThrow('Student not found')
    expect(repo.deleteStudentRepository).not.toHaveBeenCalled()
  })
})

describe('addGuardianService', () => {
  it('adiciona responsável a aluno existente', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.createGuardianRepository).mockResolvedValue(mockGuardian)

    const result = await addGuardianService('school-id', 'student-id', {
      name: 'Maria Silva',
      relationship: 'mãe',
      isResponsible: true,
      isAuthorizedPickup: true,
    })

    expect(result).toEqual(mockGuardian)
    expect(repo.createGuardianRepository).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: 'student-id', name: 'Maria Silva' }),
    )
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined as any)

    await expect(
      addGuardianService('school-id', 'nao-existe', { name: 'X', relationship: 'pai', isResponsible: false, isAuthorizedPickup: false }),
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
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(undefined as any)

    await expect(listGuardiansService('school-id', 'nao-existe')).rejects.toThrow('Student not found')
  })
})

describe('getMedicalService', () => {
  it('retorna ficha médica do aluno', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findMedicalByStudentRepository).mockResolvedValue(mockMedical)

    const result = await getMedicalService('school-id', 'student-id')

    expect(result).toEqual(mockMedical)
  })

  it('retorna null se ficha não existe', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findMedicalByStudentRepository).mockResolvedValue(null as any)

    const result = await getMedicalService('school-id', 'student-id')

    expect(result).toBeNull()
  })
})

describe('upsertMedicalService', () => {
  it('salva ficha médica do aluno', async () => {
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.upsertMedicalRepository).mockResolvedValue(mockMedical)

    const result = await upsertMedicalService('school-id', 'student-id', { allergies: 'Penicilina' })

    expect(result).toEqual(mockMedical)
    expect(repo.upsertMedicalRepository).toHaveBeenCalledWith(
      expect.objectContaining({ schoolId: 'school-id', studentId: 'student-id', allergies: 'Penicilina' }),
    )
  })
})

describe('listDocumentsService', () => {
  it('retorna documentos do aluno', async () => {
    const mockDocs = [{ id: 'doc-1', schoolId: 'school-id', studentId: 'student-id', name: 'RG.pdf', type: 'identidade', fileUrl: 'url', fileSize: null as number | null, mimeType: null as string | null, createdAt: new Date() }]
    vi.mocked(repo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findDocumentsByStudentRepository).mockResolvedValue(mockDocs)

    const result = await listDocumentsService('school-id', 'student-id')

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('RG.pdf')
  })
})
