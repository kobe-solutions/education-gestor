import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { tuitions } from '../../db/schema'

type CreateTuitionRepositoryInput = {
  schoolId: string
  studentId: string
  amount: string
  dueDate: string
}

export async function findAllTuitionsRepository(schoolId: string) {
  return db
    .select({
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
    .from(tuitions)
    .where(eq(tuitions.schoolId, schoolId))
}

export async function findTuitionsByStudentRepository(schoolId: string, studentId: string) {
  return db
    .select({
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
    .from(tuitions)
    .where(and(eq(tuitions.schoolId, schoolId), eq(tuitions.studentId, studentId)))
}

export async function findTuitionByIdRepository(schoolId: string, id: string) {
  const [tuition] = await db
    .select({
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
    .from(tuitions)
    .where(and(eq(tuitions.schoolId, schoolId), eq(tuitions.id, id)))
    .limit(1)

  return tuition
}

export async function createTuitionRepository(input: CreateTuitionRepositoryInput) {
  const [tuition] = await db
    .insert(tuitions)
    .values({
      schoolId: input.schoolId,
      studentId: input.studentId,
      amount: input.amount,
      dueDate: input.dueDate,
    })
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

  return tuition
}

export async function markTuitionAsPaidRepository(schoolId: string, id: string) {
  const [tuition] = await db
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

  return tuition
}
