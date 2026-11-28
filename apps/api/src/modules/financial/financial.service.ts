import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { tuitions } from '../../db/schema'
import { deleteFile, extractKeyFromUrl, uploadFile } from '../../lib/storage'
import {
  findAllTuitionsRepository,
  findSchoolClassOptionsRepository,
  findStudentClassMapRepository,
  findTuitionsByStudentRepository,
  findTuitionByIdRepository,
  createTuitionRepository,
  updateTuitionRepository,
  findTargetStudentIdsForBulkTuitionRepository,
  createBulkTuitionsRepository,
} from './financial.repository'
import { getStudentService } from '../students/students.service'
import { validatePositiveAmount } from '../../lib/validators'

type CreateTuitionServiceInput = {
  schoolId: string
  studentId: string
  amount: number
  dueDate: string
}

function enrichTuitionWithClass<T extends { studentId: string }>(
  tuition: T,
  classMap: Map<string, { classId: string; className: string; classIds: string[] }>,
) {
  const cls = classMap.get(tuition.studentId)
  return {
    ...tuition,
    classId: cls?.classId ?? null,
    className: cls?.className ?? null,
    classIds: cls?.classIds ?? [],
  }
}

export async function listTuitionsService(
  schoolId: string,
  opts: { limit?: number; offset?: number; status?: string } = {},
) {
  const [result, classMap, classes] = await Promise.all([
    findAllTuitionsRepository(schoolId, opts),
    findStudentClassMapRepository(schoolId),
    findSchoolClassOptionsRepository(schoolId),
  ])
  return {
    data: result.data.map((tuition) => enrichTuitionWithClass(tuition, classMap)),
    total: result.total,
    classes,
  }
}

export async function listStudentTuitionsService(schoolId: string, studentId: string) {
  const student = await getStudentService(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  const [tuitions, classMap] = await Promise.all([
    findTuitionsByStudentRepository(schoolId, studentId),
    findStudentClassMapRepository(schoolId),
  ])
  return tuitions.map((tuition) => enrichTuitionWithClass(tuition, classMap))
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

function addMonthsToDate(isoDate: string, monthsToAdd: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const targetMonthIndex = (month - 1) + monthsToAdd
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const targetMonth = (targetMonthIndex % 12) + 1
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()
  const clampedDay = Math.min(day, lastDayOfTargetMonth)
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}

export async function createBulkTuitionsService(input: {
  schoolId: string
  scope: 'school' | 'class' | 'series'
  classId?: string
  seriesId?: string
  amount: number
  firstDueDate: string
  installments: number
}) {
  validatePositiveAmount(input.amount)
  const studentIds = await findTargetStudentIdsForBulkTuitionRepository(
    input.schoolId,
    input.scope,
    input.classId,
    input.seriesId,
  )
  if (studentIds.length === 0) {
    throw new Error('No active students found for the selected scope')
  }

  const rows: Array<{ schoolId: string; studentId: string; amount: string; dueDate: string }> = []
  for (let i = 0; i < input.installments; i += 1) {
    const dueDate = addMonthsToDate(input.firstDueDate, i)
    for (const studentId of studentIds) {
      rows.push({
        schoolId: input.schoolId,
        studentId,
        amount: input.amount.toFixed(2),
        dueDate,
      })
    }
  }

  const created = await createBulkTuitionsRepository(rows)
  return {
    createdCount: created.length,
    studentCount: studentIds.length,
    installments: input.installments,
  }
}

export async function reversePaymentService(schoolId: string, id: string) {
  return db.transaction(async (tx) => {
    const [tuition] = await tx
      .select({ id: tuitions.id, status: tuitions.status, dueDate: tuitions.dueDate })
      .from(tuitions)
      .where(and(eq(tuitions.schoolId, schoolId), eq(tuitions.id, id)))
      .limit(1)
    if (!tuition) throw new Error('Tuition not found')
    if (tuition.status !== 'paid') throw new Error('Tuition is not paid')

    const today = new Date().toISOString().slice(0, 10)
    const nextStatus = tuition.dueDate < today ? 'overdue' : 'pending'

    const [updated] = await tx
      .update(tuitions)
      .set({ status: nextStatus, paidAt: null, updatedAt: new Date() })
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

export async function uploadTuitionBoletoService(
  schoolId: string,
  tuitionId: string,
  buffer: Buffer,
  mimeType: string,
  ext: string,
) {
  const tuition = await findTuitionByIdRepository(schoolId, tuitionId)
  if (!tuition) throw new Error('Tuition not found')

  if (tuition.boletoUrl) {
    await deleteFile(extractKeyFromUrl(tuition.boletoUrl)).catch(() => null)
  }

  const key = `schools/${schoolId}/tuitions/${tuitionId}/boleto.${ext}`
  const url = await uploadFile(key, buffer, mimeType)

  return updateTuitionRepository(schoolId, tuitionId, { boletoUrl: url, boletoFileSize: buffer.length })
}

export async function uploadTuitionReceiptService(
  schoolId: string,
  tuitionId: string,
  buffer: Buffer,
  mimeType: string,
  ext: string,
) {
  const tuition = await findTuitionByIdRepository(schoolId, tuitionId)
  if (!tuition) throw new Error('Tuition not found')

  if (tuition.receiptUrl) {
    await deleteFile(extractKeyFromUrl(tuition.receiptUrl)).catch(() => null)
  }

  const key = `schools/${schoolId}/tuitions/${tuitionId}/receipt.${ext}`
  const url = await uploadFile(key, buffer, mimeType)

  return updateTuitionRepository(schoolId, tuitionId, { receiptUrl: url, receiptFileSize: buffer.length })
}
