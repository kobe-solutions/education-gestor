import {
  findAllTuitionsRepository,
  findTuitionsByStudentRepository,
  findTuitionByIdRepository,
  createTuitionRepository,
  markTuitionAsPaidRepository,
} from './financial.repository'
import { findStudentByIdRepository } from '../students/students.repository'

type CreateTuitionServiceInput = {
  schoolId: string
  studentId: string
  amount: number
  dueDate: string
}

export async function listTuitionsService(schoolId: string) {
  return findAllTuitionsRepository(schoolId)
}

export async function listStudentTuitionsService(schoolId: string, studentId: string) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findTuitionsByStudentRepository(schoolId, studentId)
}

export async function createTuitionService(input: CreateTuitionServiceInput) {
  const student = await findStudentByIdRepository(input.schoolId, input.studentId)
  if (!student) throw new Error('Student not found')

  return createTuitionRepository({
    schoolId: input.schoolId,
    studentId: input.studentId,
    amount: input.amount.toString(),
    dueDate: input.dueDate,
  })
}

export async function registerPaymentService(schoolId: string, id: string) {
  const tuition = await findTuitionByIdRepository(schoolId, id)
  if (!tuition) throw new Error('Tuition not found')
  if (tuition.status === 'paid') throw new Error('Tuition already paid')

  const updated = await markTuitionAsPaidRepository(schoolId, id)
  if (!updated) throw new Error('Tuition not found')
  return updated
}
