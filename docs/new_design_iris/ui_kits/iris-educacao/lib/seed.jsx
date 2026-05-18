/* global */
// Demo seed data for the IRIS Educação UI kit.
// All deterministic, in pt-BR, plausible Brazilian school context.

const SEED = {
  // ── Dashboard ──────────────────────────────────────────────────────
  studentsCount: 412,
  teachersCount: 28,
  classesCount: 18,
  tuitionsSummary: {
    pending: { count: 37, total: 36260 },
    paid:    { count: 354, total: 347040 },
    overdue: { count: 12, total: 11760 },
  },
  upcomingTuitions: [
    { id: "u1", student: "Helena Vasconcellos",  cls: "9º A · Manhã",   due: "18/05/2026", amount: 980,  status: "pending" },
    { id: "u2", student: "João Pedro Almeida",   cls: "9º B · Manhã",   due: "19/05/2026", amount: 980,  status: "pending" },
    { id: "u3", student: "Marília Castro",       cls: "2º EM · Manhã",  due: "20/05/2026", amount: 1240, status: "overdue" },
    { id: "u4", student: "Théo Rocha",           cls: "5º A · Tarde",   due: "21/05/2026", amount: 880,  status: "paid" },
    { id: "u5", student: "Beatriz Nogueira",     cls: "Pré II · Manhã", due: "22/05/2026", amount: 760,  status: "pending" },
  ],

  // ── Students ───────────────────────────────────────────────────────
  students: [
    { id: 1, name: "Helena Vasconcellos",  code: "MAT-2026-00184", cls: "9º A · Manhã", guardian: "Cláudia Vasconcellos", status: "active",
      cpf: "123.456.789-01", rg: "30.456.789-2", birthDate: "2011-04-22", sex: "F", bloodType: "O+",
      naturalidade: "São Paulo / SP", phone: "(11) 98765-4321", email: "helena.vasconcellos@aluno.colegio.com.br",
      comorbidities: "", observations: "Aluna participa do programa de monitoria de matemática.",
      motherName: "Cláudia Vasconcellos", motherPhone: "(11) 98123-4567", fatherName: "Eduardo Vasconcellos",
      addressCep: "04567-010", addressStreet: "Rua das Acácias", addressNumber: "248", addressComplement: "Apto 71",
      addressNeighborhood: "Vila Mariana", addressCity: "São Paulo", addressState: "SP",
      allergies: "Penicilina, frutos do mar", medications: "", foodRestrictions: "Lactose", diseases: "", medicalContact: "Dra. Renata Souza · (11) 3456-1234",
      enrollmentDate: "12/02/2024", internalCode: "INT-0184",
      guardians: [
        { id: "g1", name: "Cláudia Vasconcellos", relationship: "Mãe",   cpf: "111.222.333-44", phone: "(11) 98123-4567", profession: "Médica",     email: "claudia.v@email.com", isResponsible: true,  isAuthorizedPickup: true },
        { id: "g2", name: "Eduardo Vasconcellos", relationship: "Pai",   cpf: "222.333.444-55", phone: "(11) 99876-5432", profession: "Engenheiro", email: "eduardo.v@email.com", isResponsible: true,  isAuthorizedPickup: true },
        { id: "g3", name: "Vera Vasconcellos",    relationship: "Avó",   cpf: "333.444.555-66", phone: "(11) 91234-5678", profession: "Aposentada", email: "",                    isResponsible: false, isAuthorizedPickup: true },
      ],
      documents: [
        { id: "d1", name: "Histórico_2025.pdf",   type: "historico",  fileSize: 482310,  uploadedAt: "10/03/2026" },
        { id: "d2", name: "RG_Helena.jpg",        type: "identidade", fileSize: 2114820, uploadedAt: "12/02/2024" },
        { id: "d3", name: "Boletim_2025_4bi.pdf", type: "boletim",    fileSize: 198432,  uploadedAt: "15/12/2025" },
      ],
      classes: [{ id: "c7", name: "9º A · Manhã" }],
      photoUrl: null,
    },
    { id: 2, name: "João Pedro Almeida", code: "MAT-2026-00211", cls: "9º B · Manhã",   guardian: "Rafael Almeida",     status: "active" },
    { id: 3, name: "Marília Castro",     code: "MAT-2026-00307", cls: "2º EM · Manhã",  guardian: "Sônia Castro",       status: "active" },
    { id: 4, name: "Théo Rocha",         code: "MAT-2026-00088", cls: "5º A · Tarde",   guardian: "Patrícia Rocha",     status: "active" },
    { id: 5, name: "Beatriz Nogueira",   code: "MAT-2026-00012", cls: "Pré II · Manhã", guardian: "Mariana Nogueira",   status: "active" },
    { id: 6, name: "Lucas Bittencourt",  code: "MAT-2026-00164", cls: "7º A · Manhã",   guardian: "Felipe Bittencourt", status: "active" },
    { id: 7, name: "Alice Tavares",      code: "MAT-2025-00921", cls: "3º EM · Manhã",  guardian: "Renata Tavares",     status: "transferred" },
    { id: 8, name: "Henrique Sá",        code: "MAT-2026-00399", cls: "1º EM · Tarde",  guardian: "Augusto Sá",         status: "active" },
  ],

  // ── Financial (tuitions) ───────────────────────────────────────────
  tuitions: [
    { id: "t1", student: "Helena Vasconcellos", due: "10/05/2026", amount: 980,  status: "paid" },
    { id: "t2", student: "Helena Vasconcellos", due: "10/06/2026", amount: 980,  status: "pending" },
    { id: "t3", student: "João Pedro Almeida",  due: "10/05/2026", amount: 980,  status: "paid" },
    { id: "t4", student: "Marília Castro",      due: "10/04/2026", amount: 1240, status: "overdue" },
    { id: "t5", student: "Théo Rocha",          due: "10/05/2026", amount: 880,  status: "paid" },
    { id: "t6", student: "Beatriz Nogueira",    due: "10/05/2026", amount: 760,  status: "pending" },
    { id: "t7", student: "Lucas Bittencourt",   due: "10/05/2026", amount: 980,  status: "paid" },
    { id: "t8", student: "Henrique Sá",         due: "10/05/2026", amount: 1240, status: "overdue" },
  ],

  // ── Academic structure (Nível → Série → Turma) ─────────────────────
  levels: [
    { id: "l1", name: "Educação Infantil",     type: "Infantil", series: [
      { id: "s1", name: "Maternal I", classes: [{ id: "c1", name: "MI A",  shift: "Manhã" }] },
      { id: "s2", name: "Pré II",     classes: [{ id: "c2", name: "PII A", shift: "Manhã" }, { id: "c3", name: "PII B", shift: "Tarde" }] },
    ]},
    { id: "l2", name: "Ensino Fundamental I",  type: "Fundamental I", series: [
      { id: "s3", name: "1º ano",  classes: [{ id: "c4", name: "1º A", shift: "Manhã" }] },
      { id: "s4", name: "5º ano",  classes: [{ id: "c5", name: "5º A", shift: "Tarde" }, { id: "c6", name: "5º B", shift: "Manhã" }] },
    ]},
    { id: "l3", name: "Ensino Médio",          type: "Médio", series: [
      { id: "s5", name: "1º ano EM", classes: [{ id: "c7", name: "1º EM A", shift: "Manhã" }, { id: "c8", name: "1º EM B", shift: "Tarde" }] },
      { id: "s6", name: "2º ano EM", classes: [{ id: "c9", name: "2º EM A", shift: "Manhã" }] },
    ]},
  ],

  // ── Subjects + qualified teachers (Locação de Aulas) ───────────────
  subjects: [
    { id: "sub-mat",  name: "Matemática", teachers: [
      { id: "t1", name: "Renata Albuquerque", position: "Coord. Exatas" },
      { id: "t2", name: "Bruno Cardoso",      position: "Professor titular" },
    ]},
    { id: "sub-por",  name: "Língua Portuguesa", teachers: [
      { id: "t3", name: "Sílvia Mello",       position: "Professora titular" },
      { id: "t4", name: "Marcelo Faria",      position: "Professor titular" },
    ]},
    { id: "sub-his",  name: "História",            teachers: [{ id: "t5",  name: "André Pacheco",   position: "Professor titular" }] },
    { id: "sub-geo",  name: "Geografia",           teachers: [{ id: "t6",  name: "Carla Mendonça",  position: "Professora titular" }] },
    { id: "sub-bio",  name: "Ciências / Biologia", teachers: [
      { id: "t7", name: "Patrícia Lobo",      position: "Coord. Biológicas" },
      { id: "t8", name: "Diego Ramos",        position: "Professor titular" },
    ]},
    { id: "sub-fis",  name: "Física",   teachers: [{ id: "t9",  name: "Felipe Saito",     position: "Professor titular" }] },
    { id: "sub-qui",  name: "Química",  teachers: [{ id: "t10", name: "Ricardo Brandão",  position: "Professor titular" }] },
    { id: "sub-ing",  name: "Inglês",   teachers: [
      { id: "t11", name: "Lais Bertolini",    position: "Professora titular" },
      { id: "t12", name: "Tomás Vieira",      position: "Professor titular" },
    ]},
    { id: "sub-edf",  name: "Educação Física", teachers: [{ id: "t13", name: "Júlia Souto",     position: "Professora titular" }] },
    { id: "sub-art",  name: "Artes",           teachers: [{ id: "t14", name: "Camila Tavares",  position: "Professora titular" }] },
  ],

  // Classes used by Locação screens (richer than the list)
  locClasses: [
    { id: "lc-9a",   name: "9º A",    serieName: "9º ano", shift: "Manhã", maxStudents: 32 },
    { id: "lc-9b",   name: "9º B",    serieName: "9º ano", shift: "Manhã", maxStudents: 32 },
    { id: "lc-1ema", name: "1º EM A", serieName: "1º EM",  shift: "Manhã", maxStudents: 36 },
    { id: "lc-1emb", name: "1º EM B", serieName: "1º EM",  shift: "Tarde", maxStudents: 36 },
    { id: "lc-2em",  name: "2º EM A", serieName: "2º EM",  shift: "Manhã", maxStudents: 36 },
    { id: "lc-3em",  name: "3º EM",   serieName: "3º EM",  shift: "Manhã", maxStudents: 36 },
  ],

  // Seed lessons so the timetable isn't empty for the first class
  initialLessons: {
    "lc-9a": {
      "mon:p1": { subjectId: "sub-mat", subjectName: "Matemática",          teacherId: "t1",  teacherName: "Renata Albuquerque", day: "mon", start: "07:30", end: "08:20" },
      "mon:p2": { subjectId: "sub-por", subjectName: "Língua Portuguesa",   teacherId: "t3",  teacherName: "Sílvia Mello",       day: "mon", start: "08:20", end: "09:10" },
      "tue:p1": { subjectId: "sub-his", subjectName: "História",            teacherId: "t5",  teacherName: "André Pacheco",      day: "tue", start: "07:30", end: "08:20" },
      "wed:p3": { subjectId: "sub-bio", subjectName: "Ciências / Biologia", teacherId: "t7",  teacherName: "Patrícia Lobo",      day: "wed", start: "09:30", end: "10:20" },
      "thu:p4": { subjectId: "sub-ing", subjectName: "Inglês",              teacherId: "t11", teacherName: "Lais Bertolini",     day: "thu", start: "10:20", end: "11:10" },
      "fri:p2": { subjectId: "sub-edf", subjectName: "Educação Física",     teacherId: "t13", teacherName: "Júlia Souto",        day: "fri", start: "08:20", end: "09:10" },
    },
  },

  // Seed enrolment for the kanban (class id → student id[])
  initialEnrolment: {
    "lc-9a":   [1, 2],
    "lc-1ema": [8],
  },
};

// Flat class list used by the Aluno detail "Matrícula & Turmas" tab.
const ALL_CLASSES = [
  { id: "c1",  name: "MI A · Manhã" },   { id: "c2",  name: "PII A · Manhã" }, { id: "c3",  name: "PII B · Tarde" },
  { id: "c4",  name: "1º A · Manhã" },   { id: "c5",  name: "5º A · Tarde" },  { id: "c6",  name: "5º B · Manhã" },
  { id: "c7",  name: "9º A · Manhã" },   { id: "c8",  name: "9º B · Manhã" },  { id: "c9",  name: "1º EM A · Manhã" },
  { id: "c10", name: "1º EM B · Tarde" }, { id: "c11", name: "2º EM A · Manhã" }, { id: "c12", name: "3º EM · Manhã" },
];

Object.assign(window, { SEED, ALL_CLASSES });
