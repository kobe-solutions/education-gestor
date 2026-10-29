import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { schools } from '../db/schema/schools'
import { academicYears } from '../db/schema/academicYears'
import { educationLevels } from '../db/schema/educationLevels'
import { series } from '../db/schema/series'
import { subjects } from '../db/schema/subjects'
import { teachers } from '../db/schema/teachers'
import { teacherSubjects } from '../db/schema/teacherSubjects'
import { schoolClasses } from '../db/schema/schoolClasses'
import { students } from '../db/schema/students'
import { classStudents } from '../db/schema/classRelations'
import { hashPassword } from '../lib/crypto'

const SCHOOL_SLUG = 'escola-teste-manual'
const PASSWORD = 'senha123'

async function main() {
  const [existingSchool] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.slug, SCHOOL_SLUG))
    .limit(1)

  if (existingSchool) {
    throw new Error(`A escola ${SCHOOL_SLUG} já existe. Remova-a antes de executar este seed novamente.`)
  }

  const passwordHash = hashPassword(PASSWORD)

  await db.transaction(async (tx) => {
    const [school] = await tx
      .insert(schools)
      .values({
        name: 'Escola de Teste Manual',
        slug: SCHOOL_SLUG,
        email: 'gestor@teste-manual.com',
        passwordHash,
        director: 'Alexandre Costa',
        coordinator: 'Marina Oliveira',
        phone: '(85) 3000-0000',
        address: 'Rua das Palmeiras, 120 - Fortaleza - CE',
      })
      .returning()

    const [year] = await tx
      .insert(academicYears)
      .values({
        schoolId: school.id,
        year: 2026,
        name: 'Ano Letivo 2026',
        startDate: '2026-02-02',
        endDate: '2026-12-18',
        status: 'active',
      })
      .returning()

    const [level] = await tx
      .insert(educationLevels)
      .values({
        schoolId: school.id,
        type: 'fundamental',
        modality: 'regular',
        name: 'Ensino Fundamental',
      })
      .returning()

    const [serie] = await tx
      .insert(series)
      .values({ schoolId: school.id, educationLevelId: level.id, name: '5º Ano', order: 5 })
      .returning()

    const disciplinas = await tx
      .insert(subjects)
      .values([
        { schoolId: school.id, name: 'Matemática', code: 'MAT', weeklyHours: 5 },
        { schoolId: school.id, name: 'Língua Portuguesa', code: 'POR', weeklyHours: 5 },
        { schoolId: school.id, name: 'Ciências', code: 'CIE', weeklyHours: 3 },
      ])
      .returning()

    const professores = await tx
      .insert(teachers)
      .values([
        { schoolId: school.id, email: 'ana.professora@teste-manual.com', passwordHash, name: 'Ana Souza', position: 'Professora', educationLevel: 'Graduação' },
        { schoolId: school.id, email: 'bruno.professor@teste-manual.com', passwordHash, name: 'Bruno Lima', position: 'Professor', educationLevel: 'Especialização' },
        { schoolId: school.id, email: 'carla.professora@teste-manual.com', passwordHash, name: 'Carla Santos', position: 'Professora', educationLevel: 'Graduação' },
      ])
      .returning()

    await tx.insert(teacherSubjects).values([
      { schoolId: school.id, teacherId: professores[0].id, subjectId: disciplinas[0].id },
      { schoolId: school.id, teacherId: professores[1].id, subjectId: disciplinas[1].id },
      { schoolId: school.id, teacherId: professores[2].id, subjectId: disciplinas[2].id },
    ])

    const [classroom] = await tx
      .insert(schoolClasses)
      .values({
        schoolId: school.id,
        serieId: serie.id,
        academicYearId: year.id,
        name: '5A',
        shift: 'manhã',
        maxStudents: 25,
      })
      .returning()

    const studentsData = Array.from({ length: 20 }, (_, index) => {
      const number = String(index + 1).padStart(2, '0')
      return {
        schoolId: school.id,
        name: `Aluno de Teste ${number}`,
        email: `aluno${number}@teste-manual.com`,
        enrollmentCode: `TESTE${number}`,
        internalCode: number,
        birthDate: `${2015 + (index % 2)}-${String((index % 12) + 1).padStart(2, '0')}-15`,
        sex: index % 2 === 0 ? 'F' : 'M',
        motherName: `Responsável ${number}`,
        enrollmentStatus: 'active',
        enrollmentDate: '2026-02-02',
      }
    })
    const alunos = await tx.insert(students).values(studentsData).returning()
    await tx.insert(classStudents).values(alunos.map((student) => ({ classId: classroom.id, studentId: student.id })))
  })

  console.log('Seed manual criado: 1 escola, 1 turma, 20 alunos e 3 professores.')
  console.log(`Gestor: gestor@teste-manual.com / ${PASSWORD}`)
  console.log(`Professores: ana.professora@teste-manual.com, bruno.professor@teste-manual.com, carla.professora@teste-manual.com / ${PASSWORD}`)
}

main().catch((error: unknown) => {
  console.error('Falha ao executar seed manual:', error)
  process.exitCode = 1
})
