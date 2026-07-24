import 'dotenv/config'
import { db } from '../db'
import { tuitions } from '../db/schema/financial'
import { attendances, grades } from '../db/schema/academic'
import { classStudents } from '../db/schema/classRelations'
import { timetableSlots } from '../db/schema/timetableSlots'
import { teacherSubjects } from '../db/schema/teacherSubjects'
import { studentMedical } from '../db/schema/studentMedical'
import { studentDocuments } from '../db/schema/studentDocuments'
import { guardians, students } from '../db/schema/students'
import { schoolClasses } from '../db/schema/schoolClasses'
import { teachers } from '../db/schema/teachers'
import { subjects } from '../db/schema/subjects'
import { series } from '../db/schema/series'
import { educationLevels } from '../db/schema/educationLevels'
import { classPeriods } from '../db/schema/classPeriods'
import { academicPeriods } from '../db/schema/academicPeriods'
import { academicYears } from '../db/schema/academicYears'
import { schools } from '../db/schema/schools'
import { admins } from '../db/schema/admins'

// Ordem respeitando FKs (filhos antes dos pais)
const TABELAS = [
  { nome: 'tuitions', tabela: tuitions },
  { nome: 'attendances', tabela: attendances },
  { nome: 'grades', tabela: grades },
  { nome: 'timetable_slots', tabela: timetableSlots },
  { nome: 'class_students', tabela: classStudents },
  { nome: 'teacher_subjects', tabela: teacherSubjects },
  { nome: 'student_medical', tabela: studentMedical },
  { nome: 'student_documents', tabela: studentDocuments },
  { nome: 'guardians', tabela: guardians },
  { nome: 'students', tabela: students },
  { nome: 'schoolClasses', tabela: schoolClasses },
  { nome: 'teachers', tabela: teachers },
  { nome: 'subjects', tabela: subjects },
  { nome: 'series', tabela: series },
  { nome: 'education_levels', tabela: educationLevels },
  { nome: 'class_periods', tabela: classPeriods },
  { nome: 'academic_periods', tabela: academicPeriods },
  { nome: 'academic_years', tabela: academicYears },
  { nome: 'schools', tabela: schools },
  { nome: 'admins', tabela: admins },
] as const

async function main() {
  const confirmacao = process.argv.includes('--confirm')

  if (!confirmacao) {
    console.log('⚠️  Isso apagará TODOS os dados do banco.')
    console.log('   Rode com --confirm para prosseguir:')
    console.log('   npm run db:clear -- --confirm')
    process.exit(0)
  }

  console.log('🧹 Limpando banco de dados...')

  for (const { nome, tabela } of TABELAS) {
    await db.delete(tabela)
    console.log(`  ✓ ${nome}`)
  }

  console.log('\n✅ Banco limpo com sucesso!')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Erro ao limpar banco:', err)
  process.exit(1)
})
