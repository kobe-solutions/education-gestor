import { eq, and, sql, count, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { students } from '../../db/schema'

export async function batchCreateStudentsRepository(
  rows: Array<{
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
  }>,
) {
  if (rows.length === 0) return []

  return db.insert(students).values(rows).returning({
    id: students.id,
    name: students.name,
    enrollmentCode: students.enrollmentCode,
  })
}

export async function generateBatchEnrollmentCodesRepository(schoolId: string, count: number): Promise<string[]> {
  const year = new Date().getFullYear()
  const prefix = `${year}`

  const result = await db
    .select({ total: sql<number>`count(*)` })
    .from(students)
    .where(
      and(
        eq(students.schoolId, schoolId),
        isNull(students.deletedAt),
        sql`enrollment_code LIKE ${prefix + '%'}`,
      ),
    )

  const startSeq = (Number(result[0]?.total) ?? 0) + 1

  return Array.from({ length: count }, (_, i) =>
    `${prefix}${String(startSeq + i).padStart(4, '0')}`,
  )
}

export async function findExistingCpfRepository(schoolId: string, cpfs: string[]): Promise<Set<string>> {
  const filtered = cpfs.filter(Boolean)
  if (filtered.length === 0) return new Set()

  const rows = await db
    .select({ cpf: students.cpf })
    .from(students)
    .where(
      and(
        eq(students.schoolId, schoolId),
        isNull(students.deletedAt),
        sql`cpf = ANY(${filtered}::text[])`,
      ),
    )

  return new Set(rows.map((r) => r.cpf).filter(Boolean))
}