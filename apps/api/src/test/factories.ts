/**
 * Shared test factories — centraliza a criação de mocks tipados para todos os testes.
 * Cada factory retorna um objeto que satisfaz o tipo esperado pelo Drizzle/schema.
 */

const NOW = new Date('2025-01-15T12:00:00.000Z')
const FAKE_ID = '00000000-0000-0000-0000-000000000001'
const FAKE_ID_2 = '00000000-0000-0000-0000-000000000002'

// ── Schools ──────────────────────────────────────────────────────────────────

export function makeSchool(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    name: 'Escola Teste',
    slug: 'escola-teste',
    email: 'admin@escola.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuu',
    role: 'gestor',
    director: null as string | null,
    coordinator: null as string | null,
    phone: null as string | null,
    address: null as string | null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null as Date | null,
    ...overrides,
  }
}

// ── Secretarias ──────────────────────────────────────────────────────────────

export function makeSecretaria(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    name: 'Secretaria Teste',
    email: 'secretaria@test.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuu',
    role: 'secretaria',
    phone: null as string | null,
    address: null as string | null,
    responsible: null as string | null,
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ── Students ─────────────────────────────────────────────────────────────────

export function makeStudent(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    name: 'Ana Silva',
    email: null as string | null,
    cpf: null as string | null,
    rg: null as string | null,
    birthDate: null as string | null,
    sex: null as string | null,
    bloodType: null as string | null,
    naturalidade: null as string | null,
    photoUrl: null as string | null,
    phone: null as string | null,
    motherName: null as string | null,
    fatherName: null as string | null,
    motherPhone: null as string | null,
    addressCep: null as string | null,
    addressStreet: null as string | null,
    addressNumber: null as string | null,
    addressComplement: null as string | null,
    addressNeighborhood: null as string | null,
    addressCity: null as string | null,
    addressState: null as string | null,
    comorbidities: null as string | null,
    observations: null as string | null,
    enrollmentCode: 'MAT001',
    internalCode: null as string | null,
    enrollmentStatus: 'active',
    enrollmentDate: null as string | null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null as Date | null,
    ...overrides,
  }
}

// ── Guardians ────────────────────────────────────────────────────────────────

export function makeGuardian(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    studentId: FAKE_ID,
    name: 'Maria Silva',
    email: null as string | null,
    phone: null as string | null,
    cpf: null as string | null,
    profession: null as string | null,
    relationship: 'Mãe',
    isResponsible: true,
    isAuthorizedPickup: true,
    createdAt: NOW,
    deletedAt: null as Date | null,
    ...overrides,
  }
}

// ── Teachers ─────────────────────────────────────────────────────────────────

export function makeTeacher(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    email: 'professor@escola.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuu',
    role: 'professor',
    name: 'Carlos Professor',
    cpf: null as string | null,
    rg: null as string | null,
    birthDate: null as string | null,
    sex: null as string | null,
    nationality: null as string | null,
    maritalStatus: null as string | null,
    photoUrl: null as string | null,
    phone: null as string | null,
    addressCep: null as string | null,
    addressStreet: null as string | null,
    addressNumber: null as string | null,
    addressComplement: null as string | null,
    addressNeighborhood: null as string | null,
    addressCity: null as string | null,
    addressState: null as string | null,
    position: null as string | null,
    contractType: null as string | null,
    workload: null as string | null,
    workShift: null as string | null,
    employmentStatus: 'ativo',
    educationLevel: null as string | null,
    degree: null as string | null,
    institution: null as string | null,
    professionalRegistry: null as string | null,
    bank: null as string | null,
    agency: null as string | null,
    accountNumber: null as string | null,
    accountType: null as string | null,
    pixKey: null as string | null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null as Date | null,
    ...overrides,
  }
}

// ── School Classes ───────────────────────────────────────────────────────────

export function makeSchoolClass(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    serieId: null as string | null,
    academicYearId: null as string | null,
    name: '1ª Série A',
    shift: 'manha',
    maxStudents: 40,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ── Academic Years ───────────────────────────────────────────────────────────

export function makeAcademicYear(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    year: 2025,
    name: '2025',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    registrationStart: null as string | null,
    registrationEnd: null as string | null,
    status: 'active',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ── Academic Periods ─────────────────────────────────────────────────────────

export function makeAcademicPeriod(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    academicYearId: FAKE_ID,
    name: '1º Bimestre',
    type: 'bimestre',
    order: 1,
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    gradeClosingDate: null as string | null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ── Education Levels ─────────────────────────────────────────────────────────

export function makeEducationLevel(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    type: 'fundamental',
    modality: null as string | null,
    name: 'Ensino Fundamental',
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ── Series ───────────────────────────────────────────────────────────────────

export function makeSerie(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    educationLevelId: FAKE_ID,
    name: '1ª Série',
    order: 1,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ── Subjects ─────────────────────────────────────────────────────────────────

export function makeSubject(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    name: 'Matemática',
    code: 'MAT',
    weeklyHours: 4,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ── Class Periods ────────────────────────────────────────────────────────────

export function makeClassPeriod(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    name: '1º Horário',
    startTime: '08:00',
    endTime: '08:50',
    order: 1,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ── Timetable Slots ──────────────────────────────────────────────────────────

export function makeTimetableSlot(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    classId: FAKE_ID,
    academicYearId: FAKE_ID,
    classPeriodId: FAKE_ID,
    subjectId: FAKE_ID,
    teacherId: FAKE_ID,
    weekDay: 'monday',
    createdAt: NOW,
    ...overrides,
  }
}

// ── Tuitions (Financial) ─────────────────────────────────────────────────────

export function makeTuition(overrides: Record<string, unknown> = {}) {
  return {
    id: FAKE_ID,
    schoolId: FAKE_ID,
    studentId: FAKE_ID,
    amount: '500.00',
    dueDate: '2025-02-10',
    paidAt: null as Date | null,
    status: 'pending',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export { FAKE_ID, FAKE_ID_2, NOW }
