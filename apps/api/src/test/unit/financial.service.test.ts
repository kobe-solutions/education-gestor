import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createTuitionService,
  listTuitionsService,
  listStudentTuitionsService,
  registerPaymentService,
} from '../../modules/financial/financial.service'
import * as repo from '../../modules/financial/financial.repository'
import * as studentService from '../../modules/students/students.service'

vi.mock('../../modules/financial/financial.repository')
vi.mock('../../modules/students/students.service')
vi.mock('../../db', () => ({
  db: {
    transaction: vi.fn(async (fn: (tx: unknown) => unknown) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'tuition-id', status: 'pending' }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: 'tuition-id',
          schoolId: 'school-id',
          studentId: 'student-id',
          amount: '500.00',
          dueDate: '2025-05-10',
          paidAt: new Date(),
          status: 'paid',
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      }
      return fn(mockTx)
    }),
  },
}))

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
    vi.mocked(studentService.getStudentService).mockResolvedValue(mockStudent as any)
    vi.mocked(repo.createTuitionRepository).mockResolvedValue(mockTuition)

    const result = await createTuitionService({
      schoolId: 'school-id',
      studentId: 'student-id',
      amount: 500,
      dueDate: '2025-05-10',
    })

    expect(result).toEqual(mockTuition)
    expect(repo.createTuitionRepository).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 500, studentId: 'student-id' }),
    )
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(studentService.getStudentService).mockRejectedValue(new Error('Student not found'))

    await expect(
      createTuitionService({ schoolId: 'school-id', studentId: 'nao-existe', amount: 500, dueDate: '2025-05-10' }),
    ).rejects.toThrow('Student not found')

    expect(repo.createTuitionRepository).not.toHaveBeenCalled()
  })
})

describe('listTuitionsService', () => {
  it('retorna todas as mensalidades da escola', async () => {
    vi.mocked(repo.findAllTuitionsRepository).mockResolvedValue({ data: [mockTuition], total: 1 })

    const result = await listTuitionsService('school-id')

    expect(result.data).toHaveLength(1)
    expect(repo.findAllTuitionsRepository).toHaveBeenCalledWith('school-id', {})
  })
})

describe('listStudentTuitionsService', () => {
  it('retorna mensalidades do aluno', async () => {
    vi.mocked(studentService.getStudentService).mockResolvedValue(mockStudent as any)
    vi.mocked(repo.findTuitionsByStudentRepository).mockResolvedValue([mockTuition])

    const result = await listStudentTuitionsService('school-id', 'student-id')

    expect(result).toHaveLength(1)
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(studentService.getStudentService).mockRejectedValue(new Error('Student not found'))

    await expect(listStudentTuitionsService('school-id', 'nao-existe')).rejects.toThrow('Student not found')
  })
})

describe('registerPaymentService', () => {
  it('marca mensalidade como paga', async () => {
    const result = await registerPaymentService('school-id', 'tuition-id')

    expect(result.status).toBe('paid')
    expect(result.paidAt).toBeDefined()
  })

  it('lança erro se mensalidade não existe', async () => {
    const { db } = await import('../../db')
    vi.mocked(db.transaction).mockImplementationOnce(async (fn) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      return fn(mockTx)
    })

    await expect(registerPaymentService('school-id', 'nao-existe')).rejects.toThrow('Tuition not found')
  })

  it('lança erro se mensalidade já foi paga', async () => {
    const { db } = await import('../../db')
    vi.mocked(db.transaction).mockImplementationOnce(async (fn) => {
      const mockTx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 'tuition-id', status: 'paid' }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      return fn(mockTx)
    })

    await expect(registerPaymentService('school-id', 'tuition-id')).rejects.toThrow('Tuition already paid')
  })
})
