import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { tuitions } from '../../db/schema'
import {
  findAllTuitionsRepository,
  findTuitionsByStudentRepository,
  findTuitionByIdRepository,
  createTuitionRepository,
  updateTuitionRepository,
} from './financial.repository'
import { getStudentService } from '../students/students.service'
import { validatePositiveAmount } from '../../lib/validators'

type CreateTuitionServiceInput = {
  schoolId: string
  studentId: string
  amount: number
  dueDate: string
}

export async function listTuitionsService(
  schoolId: string,
  pagination: { limit?: number; offset?: number } = {},
) {
  return findAllTuitionsRepository(schoolId, pagination)
}

export async function listStudentTuitionsService(schoolId: string, studentId: string) {
  const student = await getStudentService(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findTuitionsByStudentRepository(schoolId, studentId)
}

export async function createTuitionService(input: CreateTuitionServiceInput) {
  validatePositiveAmount(input.amount)

  const student = await getStudentService(input.schoolId, input.studentId)
  if (!student) throw new Error('Student not found')

  return createTuitionRepository({
    schoolId: input.schoolId,
    studentId: input.studentId,
    amount: input.amount,
    dueDate: input.dueDate,
  })
}

export async function updateTuitionService(
  schoolId: string,
  id: string,
  data: { amount?: number; dueDate?: string },
) {
  if (data.amount !== undefined) validatePositiveAmount(data.amount)

  const tuition = await findTuitionByIdRepository(schoolId, id)
  if (!tuition) throw new Error('Tuition not found')
  if (tuition.status === 'paid') throw new Error('Cannot update a paid tuition')

  return updateTuitionRepository(schoolId, id, {
    amount: data.amount,
    dueDate: data.dueDate,
  })
}

export async function registerPaymentService(schoolId: string, id: string) {
  return db.transaction(async (tx) => {
    const [tuition] = await tx
      .select({ id: tuitions.id, status: tuitions.status })
      .from(tuitions)
      .where(and(eq(tuitions.schoolId, schoolId), eq(tuitions.id, id)))
      .limit(1)
    if (!tuition) throw new Error('Tuition not found')
    if (tuition.status === 'paid') throw new Error('Tuition already paid')

    const [updated] = await tx
      .update(tuitions)
      .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
      .where(and(eq(tuitions.schoolId, schoolId), eq(tuitions.id, id)))
      .returning({
        id: tuitions.id,
        schoolId: tuitions.schoolId,
        studentId: tuitions.studentId,
        amount: tuitions.amount,
        dueDate: tuitions.dueDate,
        paidAt: tuitions.paidAt,
        status: tuitions.status,
        createdAt: tuitions.createdAt,
        updatedAt: tuitions.updatedAt,
      })
    if (!updated) throw new Error('Tuition not found')
    return updated
  })
}
