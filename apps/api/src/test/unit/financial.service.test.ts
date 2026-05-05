import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createTuitionService,
  listTuitionsService,
  listStudentTuitionsService,
  registerPaymentService,
} from '../../modules/financial/financial.service'
import * as repo from '../../modules/financial/financial.repository'
import * as studentRepo from '../../modules/students/students.repository'

vi.mock('../../modules/financial/financial.repository')
vi.mock('../../modules/students/students.repository')

const mockStudent = {
  id: 'student-id',
  schoolId: 'school-id',
  name: 'João',
  email: null,
  birthDate: null,
  enrollmentCode: 'MAT001',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockTuition = {
  id: 'tuition-id',
  schoolId: 'school-id',
  studentId: 'student-id',
  amount: '500.00',
  dueDate: '2025-05-10',
  paidAt: null,
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('createTuitionService', () => {
  it('cria mensalidade para aluno existente', async () => {
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.createTuitionRepository).mockResolvedValue(mockTuition)

    const result = await createTuitionService({
      schoolId: 'school-id',
      studentId: 'student-id',
      amount: 500,
      dueDate: '2025-05-10',
    })

    expect(result).toEqual(mockTuition)
    expect(repo.createTuitionRepository).toHaveBeenCalledWith(
      expect.objectContaining({ amount: '500', studentId: 'student-id' }),
    )
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(undefined)

    await expect(
      createTuitionService({ schoolId: 'school-id', studentId: 'nao-existe', amount: 500, dueDate: '2025-05-10' }),
    ).rejects.toThrow('Student not found')

    expect(repo.createTuitionRepository).not.toHaveBeenCalled()
  })
})

describe('listTuitionsService', () => {
  it('retorna todas as mensalidades da escola', async () => {
    vi.mocked(repo.findAllTuitionsRepository).mockResolvedValue([mockTuition])

    const result = await listTuitionsService('school-id')

    expect(result).toHaveLength(1)
    expect(repo.findAllTuitionsRepository).toHaveBeenCalledWith('school-id')
  })
})

describe('listStudentTuitionsService', () => {
  it('retorna mensalidades do aluno', async () => {
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findTuitionsByStudentRepository).mockResolvedValue([mockTuition])

    const result = await listStudentTuitionsService('school-id', 'student-id')

    expect(result).toHaveLength(1)
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(undefined)

    await expect(listStudentTuitionsService('school-id', 'nao-existe')).rejects.toThrow('Student not found')
  })
})

describe('registerPaymentService', () => {
  it('marca mensalidade como paga', async () => {
    const paidTuition = { ...mockTuition, status: 'paid', paidAt: new Date() }
    vi.mocked(repo.findTuitionByIdRepository).mockResolvedValue(mockTuition)
    vi.mocked(repo.markTuitionAsPaidRepository).mockResolvedValue(paidTuition)

    const result = await registerPaymentService('school-id', 'tuition-id')

    expect(result.status).toBe('paid')
    expect(result.paidAt).toBeDefined()
  })

  it('lança erro se mensalidade não existe', async () => {
    vi.mocked(repo.findTuitionByIdRepository).mockResolvedValue(undefined)

    await expect(registerPaymentService('school-id', 'nao-existe')).rejects.toThrow('Tuition not found')
    expect(repo.markTuitionAsPaidRepository).not.toHaveBeenCalled()
  })

  it('lança erro se mensalidade já foi paga', async () => {
    const paidTuition = { ...mockTuition, status: 'paid', paidAt: new Date() }
    vi.mocked(repo.findTuitionByIdRepository).mockResolvedValue(paidTuition)

    await expect(registerPaymentService('school-id', 'tuition-id')).rejects.toThrow('Tuition already paid')
    expect(repo.markTuitionAsPaidRepository).not.toHaveBeenCalled()
  })
})
