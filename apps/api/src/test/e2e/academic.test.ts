import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp, makeGestorToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/academic/academic.service', () => ({
  registerGradeService: vi.fn(),
  getStudentGradesService: vi.fn(),
  getClassGradesService: vi.fn(),
  registerAttendanceService: vi.fn(),
  registerBulkAttendanceService: vi.fn(),
  getStudentAttendancesService: vi.fn(),
  getClassAttendanceByDateService: vi.fn(),
}))

import * as academicService from '../../modules/academic/academic.service'

const IDS = {
  class: '00000000-0000-0000-0000-000000000001',
  student: '00000000-0000-0000-0000-000000000002',
  teacher: '00000000-0000-0000-0000-000000000003',
  student2: '00000000-0000-0000-0000-000000000004',
  subject: '00000000-0000-0000-0000-000000000005',
  period: '00000000-0000-0000-0000-000000000006',
}

let app: FastifyInstance
let gestorToken: string
let professorToken: string

const mockGrade = {
  id: 'grade-id',
  classId: IDS.class,
  studentId: IDS.student,
  teacherId: IDS.teacher,
  subjectId: IDS.subject,
  academicPeriodId: IDS.period,
  value: '8.5',
  subject: { id: IDS.subject, name: 'Matemática' },
  academicPeriod: { id: IDS.period, name: '1º Bimestre' },
  createdAt: new Date(),
}

const mockAttendance = {
  id: 'attendance-id',
  classId: IDS.class,
  studentId: IDS.student,
  date: '2025-04-01',
  present: true,
  createdAt: new Date(),
}

beforeAll(async () => {
  app = await buildTestApp()
  gestorToken = makeGestorToken(app)
  professorToken = makeProfessorToken(app)
})

afterAll(async () => {
  await app.close()
})

describe('POST /grades', () => {
  it('retorna 201 para professor', async () => {
    vi.mocked(academicService.registerGradeService).mockResolvedValue(mockGrade as any)

    const response = await app.inject({
      method: 'POST',
      url: '/grades',
      headers: { authorization: `Bearer ${professorToken}` },
      body: {
        classId: IDS.class,
        studentId: IDS.student,
        teacherId: IDS.teacher,
        subjectId: IDS.subject,
        academicPeriodId: IDS.period,
        value: 8.5,
      },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 201 para gestor', async () => {
    vi.mocked(academicService.registerGradeService).mockResolvedValue(mockGrade as any)

    const response = await app.inject({
      method: 'POST',
      url: '/grades',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: {
        classId: IDS.class,
        studentId: IDS.student,
        teacherId: IDS.teacher,
        subjectId: IDS.subject,
        academicPeriodId: IDS.period,
        value: 8.5,
      },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 400 com nota fora do range', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/grades',
      headers: { authorization: `Bearer ${professorToken}` },
      body: {
        classId: IDS.class,
        studentId: IDS.student,
        teacherId: IDS.teacher,
        subjectId: IDS.subject,
        academicPeriodId: IDS.period,
        value: 15, // > 10
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('retorna 401 sem token', async () => {
    const response = await app.inject({ method: 'POST', url: '/grades', body: {} })
    expect(response.statusCode).toBe(401)
  })
})

describe('GET /students/:id/grades', () => {
  it('retorna 200 com notas do aluno', async () => {
    vi.mocked(academicService.getStudentGradesService).mockResolvedValue([mockGrade as any])

    const response = await app.inject({
      method: 'GET',
      url: '/students/student-id/grades',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
  })

  it('retorna 404 se aluno não existe', async () => {
    vi.mocked(academicService.getStudentGradesService).mockRejectedValue(new Error('Student not found'))

    const response = await app.inject({
      method: 'GET',
      url: '/students/nao-existe/grades',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('POST /attendances', () => {
  it('retorna 201 ao registrar frequência', async () => {
    vi.mocked(academicService.registerAttendanceService).mockResolvedValue(mockAttendance as any)

    const response = await app.inject({
      method: 'POST',
      url: '/attendances',
      headers: { authorization: `Bearer ${professorToken}` },
      body: { classId: IDS.class, studentId: IDS.student, date: '2025-04-01', present: true },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 400 com data inválida', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/attendances',
      headers: { authorization: `Bearer ${professorToken}` },
      body: { classId: IDS.class, studentId: IDS.student, date: 'nao-e-data', present: true },
    })

    expect(response.statusCode).toBe(400)
  })
})

describe('POST /attendances/bulk', () => {
  it('retorna 201 ao registrar frequência em lote', async () => {
    vi.mocked(academicService.registerBulkAttendanceService).mockResolvedValue([
      mockAttendance as any,
      { ...mockAttendance, id: 'att-2', studentId: IDS.student2, present: false },
    ])

    const response = await app.inject({
      method: 'POST',
      url: '/attendances/bulk',
      headers: { authorization: `Bearer ${professorToken}` },
      body: {
        classId: IDS.class,
        date: '2025-04-01',
        attendances: [
          { studentId: IDS.student, present: true },
          { studentId: IDS.student2, present: false },
        ],
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toHaveLength(2)
  })
})

describe('GET /school-classes/:id/attendances', () => {
  it('retorna 200 com frequências da turma na data', async () => {
    vi.mocked(academicService.getClassAttendanceByDateService).mockResolvedValue([
      mockAttendance as any,
    ])

    const response = await app.inject({
      method: 'GET',
      url: '/school-classes/class-id/attendances?date=2025-04-01',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
  })

  it('retorna 400 sem query param date', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/school-classes/class-id/attendances',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(400)
  })
})
