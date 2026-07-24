import 'dotenv/config'
import { db } from '../db'
import { admins } from '../db/schema/admins'
import { schools } from '../db/schema/schools'
import { secretarias, secretariaSchools } from '../db/schema/secretarias'
import { academicPeriods } from '../db/schema/academicPeriods'
import { academicYears } from '../db/schema/academicYears'
import { classPeriods } from '../db/schema/classPeriods'
import { educationLevels } from '../db/schema/educationLevels'
import { series } from '../db/schema/series'
import { subjects } from '../db/schema/subjects'
import { teachers } from '../db/schema/teachers'
import { teacherSubjects } from '../db/schema/teacherSubjects'
import { schoolClasses } from '../db/schema/schoolClasses'
import { students, guardians } from '../db/schema/students'
import { studentMedical } from '../db/schema/studentMedical'
import { classStudents } from '../db/schema/classRelations'
import { timetableSlots } from '../db/schema/timetableSlots'
import { grades, attendances } from '../db/schema/academic'
import { tuitions } from '../db/schema/financial'
import { hashPassword } from '../lib/crypto'

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Dados de referência
// ---------------------------------------------------------------------------

const NOMES_MASCULINOS = [
  'Lucas', 'Gabriel', 'Pedro', 'Mateus', 'João', 'Rafael', 'Thiago', 'Bruno',
  'Gustavo', 'Felipe', 'André', 'Carlos', 'Diego', 'Eduardo', 'Fábio',
  'Henrique', 'Igor', 'Júnior', 'Leonardo', 'Marcos',
]

const NOMES_FEMININOS = [
  'Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela',
  'Isabela', 'Juliana', 'Karen', 'Larissa', 'Mariana', 'Natália', 'Patrícia',
  'Rafaela', 'Sabrina', 'Tatiana', 'Vanessa', 'Yasmin', 'Letícia',
]

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
]

const BAIRROS = ['Centro', 'Jardim América', 'Vila Nova', 'Boa Vista', 'Santa Cruz']
const CIDADES = ['São Paulo', 'Campinas', 'Ribeirão Preto', 'Santos', 'Sorocaba']
const ESTADOS = ['SP', 'RJ', 'MG', 'PR', 'RS']
const BANCOS = ['Nubank', 'Itaú', 'Bradesco', 'Caixa', 'Santander']
const TURNO = ['manhã', 'tarde', 'noite']

function gerarCPF(): string {
  const n = () => Math.floor(Math.random() * 9)
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`
}

function gerarTelefone(): string {
  return `(11) 9${Math.floor(10000000 + Math.random() * 89999999)}`
}

function nomeMasculino(): string {
  return `${pick(NOMES_MASCULINOS)} ${pick(SOBRENOMES)}`
}

function nomeFeminino(): string {
  return `${pick(NOMES_FEMININOS)} ${pick(SOBRENOMES)}`
}

function nomeAleatório(): { nome: string; sex: string } {
  const masc = Math.random() > 0.5
  return { nome: masc ? nomeMasculino() : nomeFeminino(), sex: masc ? 'M' : 'F' }
}

function emailFromName(name: string, domain: string): string {
  return `${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@${domain}`
}

// ---------------------------------------------------------------------------
// Seed principal
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Iniciando seed...')

  const senhaHash = hashPassword('senha123')
  const professoresLog: { escola: string; email: string }[] = []

  // -------------------------------------------------------------------------
  // Admin global
  // -------------------------------------------------------------------------
  console.log('  → Admin global')
  const [admin] = await db
    .insert(admins)
    .values({
      name: 'Admin Master',
      email: 'admin@educationgestor.com',
      passwordHash: senhaHash,
      role: 'admin',
    })
    .onConflictDoNothing()
    .returning()

  if (!admin) {
    console.log('    Admin já existe, pulando.')
  }

  // -------------------------------------------------------------------------
  // Secretarias de Educação
  // -------------------------------------------------------------------------
  console.log('  → Secretarias de Educação')

  const secretariasData = [
    {
      name: 'Secretaria Municipal de Educação de São Paulo',
      email: 'contato@educacao-saopaulo.sp.gov.br',
      passwordHash: senhaHash,
      role: 'secretaria',
      phone: '(11) 3113-0001',
      address: 'Praça da Sé, 108 - Sé, São Paulo - SP',
      responsible: 'Maria Helena de Souza',
      active: true,
    },
    {
      name: 'Secretaria Municipal de Educação de Campinas',
      email: 'contato@educacao-campinas.sp.gov.br',
      passwordHash: senhaHash,
      role: 'secretaria',
      phone: '(19) 3296-1000',
      address: 'Rua José Paulino, 330 - Centro, Campinas - SP',
      responsible: 'João Pedro Ferreira',
      active: true,
    },
  ]

  const secretariasInseridas = await db
    .insert(secretarias)
    .values(secretariasData)
    .onConflictDoNothing()
    .returning()

  if (secretariasInseridas.length === 0) {
    console.log('    Secretarias já existem, pulando.')
  } else {
    console.log(`    ${secretariasInseridas.length} secretarias criadas`)
  }

  // -------------------------------------------------------------------------
  // Escolas
  // -------------------------------------------------------------------------
  console.log('  → Escolas')

  const escolasData = [
    {
      name: 'Colégio São Paulo',
      slug: 'colegio-sao-paulo',
      email: 'gestor@colegiosaopaulo.com',
      passwordHash: senhaHash,
      director: 'Roberto Almeida',
      coordinator: 'Sandra Lima',
      phone: '(11) 3333-1111',
      address: 'Rua das Flores, 100 - Centro, São Paulo - SP',
    },
    {
      name: 'Colégio Nobre',
      slug: 'colegio-nobre',
      email: 'gestor@colegionobre.com',
      passwordHash: senhaHash,
      director: 'Marcos Ferreira',
      coordinator: 'Cláudia Santos',
      phone: '(11) 4444-2222',
      address: 'Av. Brasil, 500 - Vila Nova, Campinas - SP',
    },
    {
      name: 'Instituto Educacional Futuro',
      slug: 'instituto-futuro',
      email: 'gestor@institutofuturo.com',
      passwordHash: senhaHash,
      director: 'Ana Paula Costa',
      coordinator: 'Paulo Mendes',
      phone: '(11) 5555-3333',
      address: 'Rua da Educação, 250 - Boa Vista, Sorocaba - SP',
    },
  ]

  const escolasInseridas = await db
    .insert(schools)
    .values(escolasData)
    .onConflictDoNothing()
    .returning()

  if (escolasInseridas.length === 0) {
    console.error('  ✗ Escolas já existem. Rode db:clear antes de fazer seed novamente.')
    process.exit(1)
  }

  console.log(`    ${escolasInseridas.length} escolas criadas`)

  // -------------------------------------------------------------------------
  // Vínculo Secretaria ↔ Escolas
  // -------------------------------------------------------------------------
  if (secretariasInseridas.length > 0 && escolasInseridas.length > 0) {
    const vinculosData: (typeof secretariaSchools.$inferInsert)[] = []

    // Secretaria de São Paulo → todas as escolas
    const secSP = secretariasInseridas[0]
    if (secSP) {
      for (const escola of escolasInseridas) {
        vinculosData.push({ secretariaId: secSP.id, schoolId: escola.id })
      }
    }

    // Secretaria de Campinas → Colégio Nobre e Instituto Futuro
    const secCampinas = secretariasInseridas[1]
    if (secCampinas) {
      for (const escola of escolasInseridas) {
        if (escola.slug === 'colegio-nobre' || escola.slug === 'instituto-futuro') {
          vinculosData.push({ secretariaId: secCampinas.id, schoolId: escola.id })
        }
      }
    }

    await db.insert(secretariaSchools).values(vinculosData).onConflictDoNothing()
    console.log(`    → ${vinculosData.length} vínculos secretaria-escola`)
  }

  // -------------------------------------------------------------------------
  // Para cada escola: períodos, níveis, séries, disciplinas, professores,
  // turmas, alunos, responsáveis, matrículas, notas, frequência, mensalidades
  // -------------------------------------------------------------------------

  for (const escola of escolasInseridas) {
    console.log(`\n  📚 Escola: ${escola.name}`)

    // -----------------------------------------------------------------------
    // Ano letivo
    // -----------------------------------------------------------------------
    const [anoLetivo] = await db
      .insert(academicYears)
      .values({
        schoolId: escola.id,
        year: 2025,
        name: 'Ano Letivo 2025',
        startDate: '2025-02-03',
        endDate: '2025-12-19',
        registrationStart: '2024-11-01',
        registrationEnd: '2025-01-31',
        status: 'active',
      })
      .returning()
    console.log(`    → Ano letivo 2025 criado`)

    // -----------------------------------------------------------------------
    // Períodos letivos (bimestres)
    // -----------------------------------------------------------------------
    const periodosData = [
      {
        schoolId: escola.id,
        academicYearId: anoLetivo.id,
        name: '1º Bimestre',
        type: 'bimestre',
        order: 1,
        startDate: '2025-02-03',
        endDate: '2025-04-11',
        gradeClosingDate: '2025-04-14',
      },
      {
        schoolId: escola.id,
        academicYearId: anoLetivo.id,
        name: '2º Bimestre',
        type: 'bimestre',
        order: 2,
        startDate: '2025-04-14',
        endDate: '2025-06-30',
        gradeClosingDate: '2025-07-04',
      },
      {
        schoolId: escola.id,
        academicYearId: anoLetivo.id,
        name: '3º Bimestre',
        type: 'bimestre',
        order: 3,
        startDate: '2025-07-28',
        endDate: '2025-09-26',
        gradeClosingDate: '2025-09-29',
      },
      {
        schoolId: escola.id,
        academicYearId: anoLetivo.id,
        name: '4º Bimestre',
        type: 'bimestre',
        order: 4,
        startDate: '2025-09-29',
        endDate: '2025-12-19',
        gradeClosingDate: '2025-12-22',
      },
    ]

    const periodosInseridos = await db.insert(academicPeriods).values(periodosData).returning()
    console.log(`    → ${periodosInseridos.length} bimestres`)

    // -----------------------------------------------------------------------
    // Níveis de ensino
    // -----------------------------------------------------------------------
    const niveisData = [
      {
        schoolId: escola.id,
        type: 'fundamental',
        modality: 'regular',
        name: 'Ensino Fundamental',
        active: true,
      },
      {
        schoolId: escola.id,
        type: 'medio',
        modality: 'regular',
        name: 'Ensino Médio',
        active: true,
      },
    ]

    const niveisInseridos = await db.insert(educationLevels).values(niveisData).returning()
    console.log(`    → ${niveisInseridos.length} níveis de ensino`)

    const nivelFundamental = niveisInseridos.find((n) => n.type === 'fundamental')!
    const nivelMedio = niveisInseridos.find((n) => n.type === 'medio')!

    // -----------------------------------------------------------------------
    // Séries
    // -----------------------------------------------------------------------
    const seriesData = [
      // Fundamental (1º ao 9º)
      ...range(9).map((i) => ({
        schoolId: escola.id,
        educationLevelId: nivelFundamental.id,
        name: `${i + 1}º Ano`,
        order: i + 1,
      })),
      // Médio (1º ao 3º)
      ...range(3).map((i) => ({
        schoolId: escola.id,
        educationLevelId: nivelMedio.id,
        name: `${i + 1}º Ano`,
        order: i + 1,
      })),
    ]

    const seriesInseridas = await db.insert(series).values(seriesData).returning()
    console.log(`    → ${seriesInseridas.length} séries`)

    // -----------------------------------------------------------------------
    // Disciplinas
    // -----------------------------------------------------------------------
    const disciplinasData = [
      { schoolId: escola.id, name: 'Matemática', code: 'MAT', weeklyHours: 5 },
      { schoolId: escola.id, name: 'Língua Portuguesa', code: 'POR', weeklyHours: 5 },
      { schoolId: escola.id, name: 'Ciências', code: 'CIE', weeklyHours: 3 },
      { schoolId: escola.id, name: 'História', code: 'HIS', weeklyHours: 3 },
      { schoolId: escola.id, name: 'Geografia', code: 'GEO', weeklyHours: 3 },
      { schoolId: escola.id, name: 'Inglês', code: 'ING', weeklyHours: 2 },
      { schoolId: escola.id, name: 'Arte', code: 'ART', weeklyHours: 2 },
      { schoolId: escola.id, name: 'Educação Física', code: 'EDF', weeklyHours: 2 },
      { schoolId: escola.id, name: 'Biologia', code: 'BIO', weeklyHours: 3 },
      { schoolId: escola.id, name: 'Física', code: 'FIS', weeklyHours: 3 },
      { schoolId: escola.id, name: 'Química', code: 'QUI', weeklyHours: 3 },
      { schoolId: escola.id, name: 'Filosofia', code: 'FIL', weeklyHours: 2 },
    ]

    const disciplinasInseridas = await db.insert(subjects).values(disciplinasData).returning()
    console.log(`    → ${disciplinasInseridas.length} disciplinas`)

    // -----------------------------------------------------------------------
    // Professores (10 por escola)
    // -----------------------------------------------------------------------
    const professoresData = range(10).map((i) => {
      const { nome, sex } = nomeAleatório()
      const email = emailFromName(nome, `${escola.slug}.com`)
      return {
        schoolId: escola.id,
        email: `prof${i + 1}.${email}`,
        passwordHash: senhaHash,
        role: 'professor',
        name: nome,
        cpf: gerarCPF(),
        birthDate: `${1970 + Math.floor(Math.random() * 25)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        sex,
        nationality: 'Brasileira',
        phone: gerarTelefone(),
        addressNeighborhood: pick(BAIRROS),
        addressCity: pick(CIDADES),
        addressState: 'SP',
        position: pick(['Professor(a)', 'Professor(a) Coordenador(a)']),
        contractType: pick(['CLT', 'PJ', 'Estatutário']),
        workload: pick(['20h', '30h', '40h']),
        workShift: pick(TURNO),
        employmentStatus: 'ativo',
        educationLevel: pick(['Graduação', 'Especialização', 'Mestrado']),
        bank: pick(BANCOS),
        pixKey: gerarCPF(),
      }
    })

    const professoresInseridos = await db.insert(teachers).values(professoresData).returning()
    console.log(`    → ${professoresInseridos.length} professores`)

    for (const prof of professoresInseridos) {
      professoresLog.push({ escola: escola.name, email: prof.email })
    }

    // -----------------------------------------------------------------------
    // Vínculo professor ↔ disciplina (2-3 por professor)
    // -----------------------------------------------------------------------
    const teacherSubjectsData: (typeof teacherSubjects.$inferInsert)[] = []
    for (const professor of professoresInseridos) {
      const qtd = 2 + Math.floor(Math.random() * 2) // 2 ou 3
      const shuffle = [...disciplinasInseridas].sort(() => Math.random() - 0.5).slice(0, qtd)
      for (const disc of shuffle) {
        teacherSubjectsData.push({ teacherId: professor.id, subjectId: disc.id, schoolId: escola.id })
      }
    }
    await db.insert(teacherSubjects).values(teacherSubjectsData).onConflictDoNothing()
    console.log(`    → ${teacherSubjectsData.length} vínculos professor-disciplina`)

    // -----------------------------------------------------------------------
    // Períodos de aula (6 horários)
    // -----------------------------------------------------------------------
    const classPeriodsData = [
      { schoolId: escola.id, name: '1º Período', startTime: '07:00', endTime: '07:50', order: 1 },
      { schoolId: escola.id, name: '2º Período', startTime: '07:50', endTime: '08:40', order: 2 },
      { schoolId: escola.id, name: '3º Período', startTime: '08:50', endTime: '09:40', order: 3 },
      { schoolId: escola.id, name: '4º Período', startTime: '09:40', endTime: '10:30', order: 4 },
      { schoolId: escola.id, name: '5º Período', startTime: '10:40', endTime: '11:30', order: 5 },
      { schoolId: escola.id, name: '6º Período', startTime: '11:30', endTime: '12:20', order: 6 },
    ]
    const periodsInseridos = await db.insert(classPeriods).values(classPeriodsData).returning()
    console.log(`    → ${periodsInseridos.length} períodos de aula`)

    // -----------------------------------------------------------------------
    // Turmas (12 por escola — 4 Fundamental + 4 Médio por turno)
    // -----------------------------------------------------------------------
    const seriesFundamental = seriesInseridas.filter((s) => s.educationLevelId === nivelFundamental.id)
    const seriesMedio = seriesInseridas.filter((s) => s.educationLevelId === nivelMedio.id)

    const turmasData = [
      // Fundamental: 6 turmas (6º ao 9º + extras)
      { schoolId: escola.id, serieId: seriesFundamental[5].id, academicPeriodId: periodosInseridos[1].id, name: '6A', shift: 'manhã', maxStudents: 35 },
      { schoolId: escola.id, serieId: seriesFundamental[5].id, academicPeriodId: periodosInseridos[1].id, name: '6B', shift: 'tarde', maxStudents: 35 },
      { schoolId: escola.id, serieId: seriesFundamental[6].id, academicPeriodId: periodosInseridos[1].id, name: '7A', shift: 'manhã', maxStudents: 35 },
      { schoolId: escola.id, serieId: seriesFundamental[6].id, academicPeriodId: periodosInseridos[1].id, name: '7B', shift: 'tarde', maxStudents: 35 },
      { schoolId: escola.id, serieId: seriesFundamental[7].id, academicPeriodId: periodosInseridos[1].id, name: '8A', shift: 'manhã', maxStudents: 35 },
      { schoolId: escola.id, serieId: seriesFundamental[8].id, academicPeriodId: periodosInseridos[1].id, name: '9A', shift: 'manhã', maxStudents: 35 },
      // Médio: 6 turmas
      { schoolId: escola.id, serieId: seriesMedio[0].id, academicPeriodId: periodosInseridos[1].id, name: '1MA', shift: 'manhã', maxStudents: 40 },
      { schoolId: escola.id, serieId: seriesMedio[0].id, academicPeriodId: periodosInseridos[1].id, name: '1MB', shift: 'noite', maxStudents: 40 },
      { schoolId: escola.id, serieId: seriesMedio[1].id, academicPeriodId: periodosInseridos[1].id, name: '2MA', shift: 'manhã', maxStudents: 40 },
      { schoolId: escola.id, serieId: seriesMedio[1].id, academicPeriodId: periodosInseridos[1].id, name: '2MB', shift: 'noite', maxStudents: 40 },
      { schoolId: escola.id, serieId: seriesMedio[2].id, academicPeriodId: periodosInseridos[1].id, name: '3MA', shift: 'manhã', maxStudents: 40 },
      { schoolId: escola.id, serieId: seriesMedio[2].id, academicPeriodId: periodosInseridos[1].id, name: '3MB', shift: 'noite', maxStudents: 40 },
    ]

    const turmasInseridas = await db.insert(schoolClasses).values(turmasData).returning()
    console.log(`    → ${turmasInseridas.length} turmas`)

    // -----------------------------------------------------------------------
    // Alunos (30-35 por turma)
    // -----------------------------------------------------------------------
    const alunosData: (typeof students.$inferInsert)[] = []
    const alunosPorTurma: number[] = []

    for (const turma of turmasInseridas) {
      const alunosNaTurma = 30 + Math.floor(Math.random() * 6) // 30 a 35
      alunosPorTurma.push(alunosNaTurma)
      for (let i = 0; i < alunosNaTurma; i++) {
        const { nome, sex } = nomeAleatório()
        const idx = alunosData.length + 1
        alunosData.push({
          schoolId: escola.id,
          name: nome,
          email: emailFromName(nome, 'gmail.com'),
          cpf: gerarCPF(),
          birthDate: `${2005 + Math.floor(Math.random() * 8)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          sex,
          phone: gerarTelefone(),
          motherName: nomeFeminino(),
          fatherName: nomeMasculino(),
          motherPhone: gerarTelefone(),
          addressCep: `01${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
          addressStreet: `Rua ${pick(SOBRENOMES)}`,
          addressNumber: String(Math.floor(Math.random() * 999) + 1),
          addressNeighborhood: pick(BAIRROS),
          addressCity: pick(CIDADES),
          addressState: 'SP',
          enrollmentCode: `${escola.slug.toUpperCase().slice(0, 3)}${String(idx).padStart(4, '0')}`,
          internalCode: String(idx).padStart(5, '0'),
          enrollmentStatus: pick(['active', 'active', 'active', 'inactive']),
          enrollmentDate: '2025-02-03',
        })
      }
    }

    const alunosInseridos = await db.insert(students).values(alunosData).returning()
    console.log(`    → ${alunosInseridos.length} alunos`)

    // -----------------------------------------------------------------------
    // Responsáveis (1-2 por aluno)
    // -----------------------------------------------------------------------
    const responsaveisData: (typeof guardians.$inferInsert)[] = []

    for (const aluno of alunosInseridos) {
      // Responsável principal (mãe)
      responsaveisData.push({
        studentId: aluno.id,
        name: nomeFeminino(),
        email: emailFromName(aluno.name + 'mae', 'gmail.com'),
        phone: gerarTelefone(),
        cpf: gerarCPF(),
        profession: pick(['Professora', 'Enfermeira', 'Empresária', 'Funcionária Pública', 'Autônoma']),
        relationship: 'mãe',
        isResponsible: true,
        isAuthorizedPickup: true,
      })

      // Segundo responsável (pai) — 70% dos alunos
      if (Math.random() > 0.3) {
        responsaveisData.push({
          studentId: aluno.id,
          name: nomeMasculino(),
          email: emailFromName(aluno.name + 'pai', 'gmail.com'),
          phone: gerarTelefone(),
          cpf: gerarCPF(),
          profession: pick(['Engenheiro', 'Médico', 'Motorista', 'Contador', 'Advogado']),
          relationship: 'pai',
          isResponsible: false,
          isAuthorizedPickup: true,
        })
      }
    }

    await db.insert(guardians).values(responsaveisData)
    console.log(`    → ${responsaveisData.length} responsáveis`)

    // -----------------------------------------------------------------------
    // Matrículas nas turmas (classStudents)
    // -----------------------------------------------------------------------
    const matriculasData: (typeof classStudents.$inferInsert)[] = []
    let alunoIdx = 0

    for (let t = 0; t < turmasInseridas.length; t++) {
      const turma = turmasInseridas[t]
      const qtd = alunosPorTurma[t]
      for (let i = 0; i < qtd; i++) {
        const aluno = alunosInseridos[alunoIdx++]
        matriculasData.push({ classId: turma.id, studentId: aluno.id })
      }
    }

    await db.insert(classStudents).values(matriculasData)
    console.log(`    → ${matriculasData.length} matrículas em turmas`)

    // -----------------------------------------------------------------------
    // Grade horária (timetable) — seg a sex, min 5 aulas/dia por professor
    // -----------------------------------------------------------------------
    const DIAS_SEMANA = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    const timetableSlotsData: (typeof timetableSlots.$inferInsert)[] = []
    const usedTeacherSlots = new Set<string>()

    // Helper: adicionar slot se não houver conflito
    function tryAddSlot(teacherId: string, classId: string, dia: string, periodoId: string, subjectId: string) {
      const key = `${teacherId}-${dia}-${periodoId}`
      if (usedTeacherSlots.has(key)) return false
      usedTeacherSlots.add(key)
      timetableSlotsData.push({
        schoolId: escola.id,
        classId,
        academicYearId: anoLetivo.id,
        classPeriodId: periodoId,
        subjectId,
        teacherId,
        weekDay: dia,
      })
      return true
    }

    // Fase 1: Garantir min 5 aulas por professor por dia
    for (const prof of professoresInseridos) {
      for (const dia of DIAS_SEMANA) {
        let aulasNesseDia = 0
        // Tentar colocar o professor em até 5 períodos diferentes
        const periodosEmbaralhados = [...periodsInseridos].sort(() => Math.random() - 0.5)
        for (const periodo of periodosEmbaralhados) {
          if (aulasNesseDia >= 5) break
          // Escolher uma turma aleatória e disciplina
          const turma = pick(turmasInseridas)
          const disc = pick(disciplinasInseridas)
          if (tryAddSlot(prof.id, turma.id, dia, periodo.id, disc.id)) {
            aulasNesseDia++
          }
        }
      }
    }

    // Fase 2: Preencher slots restantes para completar a grade das turmas
    for (const turma of turmasInseridas) {
      for (const dia of DIAS_SEMANA) {
        for (const periodo of periodsInseridos) {
          const key = `*-${dia}-${periodo.id}`
          // Verificar se já tem alguém nesse horário nessa turma
          const temAlguem = timetableSlotsData.some(
            (s) => s.classId === turma.id && s.weekDay === dia && s.classPeriodId === periodo.id,
          )
          if (temAlguem) continue

          const disc = pick(disciplinasInseridas)
          const candidatos = professoresInseridos.filter((p) => {
            const k = `${p.id}-${dia}-${periodo.id}`
            return !usedTeacherSlots.has(k)
          })
          if (candidatos.length === 0) continue
          const prof = pick(candidatos)
          tryAddSlot(prof.id, turma.id, dia, periodo.id, disc.id)
        }
      }
    }

    for (let i = 0; i < timetableSlotsData.length; i += 200) {
      await db.insert(timetableSlots).values(timetableSlotsData.slice(i, i + 200)).onConflictDoNothing()
    }
    console.log(`    → ${timetableSlotsData.length} slots de grade horária`)

    // -----------------------------------------------------------------------
    // Ficha médica — 40% dos alunos têm alguma informação
    // -----------------------------------------------------------------------
    const ALERGIAS = ['Poeira', 'Látex', 'Amendoim', 'Leite', 'Glúten', 'Frutos do mar']
    const MEDICAMENTOS = ['Ritalina', 'Concerta', 'Omeprazol', 'Antihistamínico', 'Dipirona']
    const RESTRICOES = ['Lactose', 'Glúten', 'Amendoim', 'Frutos do mar']
    const DOENCAS = ['Asma', 'Diabetes tipo 1', 'Epilepsia', 'TDAH', 'Hipertensão']

    const fichasMedicasData: (typeof studentMedical.$inferInsert)[] = []
    for (const aluno of alunosInseridos) {
      if (Math.random() > 0.6) continue
      fichasMedicasData.push({
        schoolId: escola.id,
        studentId: aluno.id,
        allergies: Math.random() > 0.4 ? pick(ALERGIAS) : null,
        medications: Math.random() > 0.6 ? pick(MEDICAMENTOS) : null,
        foodRestrictions: Math.random() > 0.5 ? pick(RESTRICOES) : null,
        diseases: Math.random() > 0.6 ? pick(DOENCAS) : null,
        medicalContact: Math.random() > 0.5 ? gerarTelefone() : null,
      })
    }
    if (fichasMedicasData.length > 0) {
      await db.insert(studentMedical).values(fichasMedicasData)
    }
    console.log(`    → ${fichasMedicasData.length} fichas médicas`)

    // -----------------------------------------------------------------------
    // Notas — por período, por disciplina, por aluno/turma/professor
    // -----------------------------------------------------------------------
    const notasData: (typeof grades.$inferInsert)[] = []

    for (const periodo of periodosInseridos) {
      let alunoBase = 0
      for (let t = 0; t < turmasInseridas.length; t++) {
        const turma = turmasInseridas[t]
        const qtd = alunosPorTurma[t]
        for (let i = 0; i < qtd; i++) {
          const aluno = alunosInseridos[alunoBase + i]
          for (const disciplina of disciplinasInseridas) {
            const professor = pick(professoresInseridos)
            notasData.push({
              schoolId: escola.id,
              classId: turma.id,
              studentId: aluno.id,
              teacherId: professor.id,
              subjectId: disciplina.id,
              academicPeriodId: periodo.id,
              value: String((Math.random() * 6 + 4).toFixed(1)), // entre 4.0 e 10.0
            })
          }
        }
        alunoBase += qtd
      }
    }

    // Inserir em lotes de 500 para não sobrecarregar
    for (let i = 0; i < notasData.length; i += 500) {
      await db.insert(grades).values(notasData.slice(i, i + 500))
    }
    console.log(`    → ${notasData.length} notas`)

    // -----------------------------------------------------------------------
    // Frequência — últimos 60 dias letivos (seg-sex)
    // -----------------------------------------------------------------------
    const frequenciasData: (typeof attendances.$inferInsert)[] = []
    const hoje = new Date('2025-05-16')
    const diasLetivos: Date[] = []

    for (let d = 0; diasLetivos.length < 60; d++) {
      const dia = addDays(hoje, -d)
      const diaSemana = dia.getDay()
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasLetivos.push(dia)
      }
    }

    let alunoBase = 0
    for (let t = 0; t < turmasInseridas.length; t++) {
      const turma = turmasInseridas[t]
      const qtd = alunosPorTurma[t]
      for (let i = 0; i < qtd; i++) {
        const aluno = alunosInseridos[alunoBase + i]
        for (const dia of diasLetivos) {
          frequenciasData.push({
            schoolId: escola.id,
            classId: turma.id,
            studentId: aluno.id,
            date: formatDate(dia),
            present: Math.random() > 0.12, // ~88% de presença
          })
        }
      }
      alunoBase += qtd
    }

    // Inserir em lotes de 500
    for (let i = 0; i < frequenciasData.length; i += 500) {
      await db.insert(attendances).values(frequenciasData.slice(i, i + 500))
    }
    console.log(`    → ${frequenciasData.length} registros de frequência`)

    // -----------------------------------------------------------------------
    // Mensalidades — 12 meses por aluno
    // -----------------------------------------------------------------------
    const mensalidadesData: (typeof tuitions.$inferInsert)[] = []

    for (const aluno of alunosInseridos) {
      for (let mes = 1; mes <= 12; mes++) {
        const vencimento = new Date(2025, mes - 1, 10)
        const pago = vencimento < hoje
        const valorBase = pick([750, 850, 950, 1050, 1200])

        mensalidadesData.push({
          schoolId: escola.id,
          studentId: aluno.id,
          amount: String(valorBase),
          dueDate: formatDate(vencimento),
          status: pago ? pick(['paid', 'paid', 'paid', 'overdue']) : 'pending',
          paidAt: pago && Math.random() > 0.15 ? new Date(vencimento.getTime() - Math.random() * 5 * 86400000) : null,
        })
      }
    }

    await db.insert(tuitions).values(mensalidadesData)
    console.log(`    → ${mensalidadesData.length} mensalidades`)
  }

  console.log('\n✅ Seed concluído com sucesso!')
  console.log('\nCredenciais de acesso (senha: senha123):')
  console.log('  Admin:       admin@educationgestor.com')
  console.log('  Secretaria:  contato@educacao-saopaulo.sp.gov.br')
  console.log('  Secretaria:  contato@educacao-campinas.sp.gov.br')
  console.log('  Escola:      gestor@colegiosaopaulo.com')
  console.log('  Escola:      gestor@colegionobre.com')
  console.log('  Escola:      gestor@institutofuturo.com')
  console.log('\nProfessores:')
  for (const p of professoresLog) {
    console.log(`  ${p.escola}: ${p.email}`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Erro no seed:', err)
  process.exit(1)
})
