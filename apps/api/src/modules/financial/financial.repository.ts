import { eq, and, count } from 'drizzle-orm'
import { db } from '../../db'
import { tuitions, students } from '../../db/schema'

type CreateTuitionRepositoryInput = {
  schoolId: string
  studentId: string
  amount: number
  dueDate: string
}

export async function findAllTuitionsRepository(
  schoolId: string,
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const [data, [countResult]] = await Promise.all([
    db.select({
      id: tuitions.id,
      schoolId: tuitions.schoolId,
      studentId: tuitions.studentId,
      studentName: students.name,
      amount: tuitions.amount,
      dueDate: tuitions.dueDate,
      paidAt: tuitions.paidAt,
      status: tuitions.status,
      boletoUrl: tuitions.boletoUrl,
      boletoFileSize: tuitions.boletoFileSize,
      receiptUrl: tuitions.receiptUrl,
      receiptFileSize: tuitions.receiptFileSize,
      createdAt: tuitions.createdAt,
      updatedAt: tuitions.updatedAt,
    }).from(tuitions)
      .leftJoin(students, eq(tuitions.studentId, students.id))
      .where(eq(tuitions.schoolId, schoolId))
      .orderBy(tuitions.dueDate)
      .limit(limit).offset(offset),
    db.select({ total: count() }).from(tuitions)
      .where(eq(tuitions.schoolId, schoolId)),
  ])
  return { data, total: countResult.total }
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
      boletoUrl: tuitions.boletoUrl,
      boletoFileSize: tuitions.boletoFileSize,
      receiptUrl: tuitions.receiptUrl,
      receiptFileSize: tuitions.receiptFileSize,
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
      boletoUrl: tuitions.boletoUrl,
      boletoFileSize: tuitions.boletoFileSize,
      receiptUrl: tuitions.receiptUrl,
      receiptFileSize: tuitions.receiptFileSize,
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
      amount: input.amount.toString(),
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
      boletoUrl: tuitions.boletoUrl,
      boletoFileSize: tuitions.boletoFileSize,
      receiptUrl: tuitions.receiptUrl,
      receiptFileSize: tuitions.receiptFileSize,
      createdAt: tuitions.createdAt,
      updatedAt: tuitions.updatedAt,
    })

  return tuition
}

export async function updateTuitionRepository(
  schoolId: string,
  id: string,
  input: { amount?: number; dueDate?: string; boletoUrl?: string; boletoFileSize?: number; receiptUrl?: string; receiptFileSize?: number },
) {
  const setValues: { amount?: string; dueDate?: string; boletoUrl?: string; boletoFileSize?: number; receiptUrl?: string; receiptFileSize?: number; updatedAt: Date } = { updatedAt: new Date() }
  if (input.amount !== undefined) setValues.amount = input.amount.toString()
  if (input.dueDate !== undefined) setValues.dueDate = input.dueDate
  if (input.boletoUrl !== undefined) setValues.boletoUrl = input.boletoUrl
  if (input.boletoFileSize !== undefined) setValues.boletoFileSize = input.boletoFileSize
  if (input.receiptUrl !== undefined) setValues.receiptUrl = input.receiptUrl
  if (input.receiptFileSize !== undefined) setValues.receiptFileSize = input.receiptFileSize

  const [tuition] = await db
    .update(tuitions)
    .set(setValues)
    .where(and(eq(tuitions.schoolId, schoolId), eq(tuitions.id, id)))
    .returning({
      id: tuitions.id,
      schoolId: tuitions.schoolId,
      studentId: tuitions.studentId,
      amount: tuitions.amount,
      dueDate: tuitions.dueDate,
      paidAt: tuitions.paidAt,
      status: tuitions.status,
      boletoUrl: tuitions.boletoUrl,
      boletoFileSize: tuitions.boletoFileSize,
      receiptUrl: tuitions.receiptUrl,
      receiptFileSize: tuitions.receiptFileSize,
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
      boletoUrl: tuitions.boletoUrl,
      boletoFileSize: tuitions.boletoFileSize,
      receiptUrl: tuitions.receiptUrl,
      receiptFileSize: tuitions.receiptFileSize,
      createdAt: tuitions.createdAt,
      updatedAt: tuitions.updatedAt,
    })

  return tuition
}
