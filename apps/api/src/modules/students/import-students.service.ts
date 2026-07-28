import { parseSpreadsheet } from '@education-gestor/shared'
import { importStudentRowSchema } from './import-students.schema'
import { batchCreateStudentsRepository, generateBatchEnrollmentCodesRepository, findExistingCpfRepository } from './import-students.repository'
import { logAudit } from '../../lib/audit'
import type { ImportResult, ImportResultRow } from './import-students.schema'

type AuditCtx = {
  userId: string
  userRole: string
  schoolId: string
}

export async function importStudentsService(
  schoolId: string,
  buffer: Buffer,
  fileName: string,
  audit: AuditCtx,
): Promise<ImportResult> {
  const parsed = parseSpreadsheet(buffer, fileName)

  if (parsed.totalRows === 0) {
    return {
      totalRows: 0,
      imported: 0,
      errors: 0,
      details: [],
    }
  }

  const cpfs = parsed.rows.map((row) => row.cpf ?? '').filter(Boolean)
  const existingCpfs = await findExistingCpfRepository(schoolId, cpfs)

  const validRows: Array<{
    schoolId: string
    name: string
    enrollmentCode: string
    birthDate?: string
    cpf?: string
    rg?: string
    sex?: string
    bloodType?: string
    naturalidade?: string
    email?: string
    phone?: string
    motherName?: string
    fatherName?: string
    motherPhone?: string
    addressCep?: string
    addressStreet?: string
    addressNumber?: string
    addressComplement?: string
    addressNeighborhood?: string
    addressCity?: string
    addressState?: string
    comorbidities?: string
    observations?: string
    internalCode?: string
    enrollmentDate?: string
    enrollmentStatus?: string
  }> = []

  const details: ImportResultRow[] = []

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]
    const rowNumber = i + 2

    const parsedRow = importStudentRowSchema.safeParse(row)

    if (!parsedRow.success) {
      const messages = parsedRow.error.issues.map((issue) => issue.message).join('; ')
      details.push({ row: rowNumber, status: 'error', message: messages })
      continue
    }

    const cpf = parsedRow.data.cpf
    if (cpf && existingCpfs.has(cpf)) {
      details.push({ row: rowNumber, status: 'error', message: `CPF ${cpf} já cadastrado` })
      continue
    }

    validRows.push({
      schoolId,
      ...parsedRow.data,
      enrollmentCode: '',
    })
  }

  if (validRows.length === 0) {
    return {
      totalRows: parsed.totalRows,
      imported: 0,
      errors: details.length,
      details,
    }
  }

  const enrollmentCodes = await generateBatchEnrollmentCodesRepository(schoolId, validRows.length)

  const rowsToInsert = validRows.map((row, index) => ({
    ...row,
    enrollmentCode: enrollmentCodes[index],
    enrollmentDate: row.enrollmentDate ?? new Date().toISOString().split('T')[0],
    enrollmentStatus: row.enrollmentStatus ?? 'active',
    email: row.email || undefined,
  }))

  const created = await batchCreateStudentsRepository(rowsToInsert)

  for (const student of created) {
    details.push({
      row: 0,
      status: 'success',
      studentId: student.id,
      message: `Matrícula ${student.enrollmentCode}`,
    })
  }

  await logAudit(audit, 'CREATE', 'student', `batch:${created.length}`, {
    fileName,
    totalRows: parsed.totalRows,
    imported: created.length,
    errors: details.filter((d) => d.status === 'error').length,
  }).catch(() => null)

  return {
    totalRows: parsed.totalRows,
    imported: created.length,
    errors: details.filter((d) => d.status === 'error').length,
    details,
  }
}