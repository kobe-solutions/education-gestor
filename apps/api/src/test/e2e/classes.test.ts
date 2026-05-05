import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp, makeGestorToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/classes/schoolClasses.service', () => ({
  listSchoolClassesService: vi.fn(),
  getSchoolClassService: vi.fn(),
  createSchoolClassService: vi.fn(),
  updateSchoolClassService: vi.fn(),
  deleteSchoolClassService: vi.fn(),
  addTeacherToClassService: vi.fn(),
  addStudentToClassService: vi.fn(),
  removeStudentFromClassService: vi.fn(),
}))

vi.mock('../../modules/academicPeriods/academicPeriods.service', () => ({
  listAcademicPeriodsService: vi.fn(),
  getAcademicPeriodService: vi.fn(),
  createAcademicPeriodService: vi.fn(),
  updateAcademicPeriodService: vi.fn(),
  deleteAcademicPeriodService: vi.fn(),
}))

import * as classesService from '../../modules/classes/schoolClasses.service'
import * as periodsService from '../../modules/academicPeriods/academicPeriods.service'

const IDS = {
  class: '00000000-0000-0000-0000-000000000001',
  school: '00000000-0000-0000-0000-000000000002',
  teacher: '00000000-0000-0000-0000-000000000003',
  student: '00000000-0000-0000-0000-000000000004',
  period: '00000000-0000-0000-0000-000000000005',
}

let app: FastifyInstance
let gestorToken: string
let professorToken: string

const mockClass = {
  id: IDS.class,
  schoolId: IDS.school,
  name: '1A',
  grade: '1',
  shift: 'manhã',
  termTime: '2025',
  teachers: [],
  students: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockPeriod = {
  id: IDS.period,
  schoolId: 'school-id',
  name: '2025',
  startDate: '2025-02-01',
  endDate: '2025-12-15',
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

beforeAll(async () => {
  app = await buildTestApp()
  gestorToken = makeGestorToken(app)
  professorToken = makeProfessorToken(app)
})

afterAll(async () => {
  await app.close()
})

describe('GET /school-classes', () => {
  it('retorna 200 para gestor', async () => {
    vi.mocked(classesService.listSchoolClassesService).mockResolvedValue([mockClass])

    const response = await app.inject({
      method: 'GET',
      url: '/school-classes',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
  })

  it('retorna 401 sem token', async () => {
    const response = await app.inject({ method: 'GET', url: '/school-classes' })
    expect(response.statusCode).toBe(401)
  })

  it('retorna 403 para professor', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/school-classes',
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(response.statusCode).toBe(403)
  })
})

describe('GET /school-classes/:id', () => {
  it('retorna 200 com dados da turma + membros', async () => {
    vi.mocked(classesService.getSchoolClassService).mockResolvedValue(mockClass)

    const response = await app.inject({
      method: 'GET',
      url: '/school-classes/class-id',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('teachers')
    expect(response.json()).toHaveProperty('students')
  })

  it('retorna 404 quando turma não existe', async () => {
    vi.mocked(classesService.getSchoolClassService).mockRejectedValue(new Error('Class not found'))

    const response = await app.inject({
      method: 'GET',
      url: '/school-classes/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('POST /school-classes', () => {
  it('retorna 201 ao criar turma', async () => {
    vi.mocked(classesService.createSchoolClassService).mockResolvedValue(mockClass)

    const response = await app.inject({
      method: 'POST',
      url: '/school-classes',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '1A', grade: '1', shift: 'manhã', termTime: '2025' },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 400 com body inválido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/school-classes',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'A' }, // campos obrigatórios faltando
    })

    expect(response.statusCode).toBe(400)
  })
})

describe('POST /school-classes/:id/teachers', () => {
  it('retorna 201 ao adicionar professor à turma', async () => {
    vi.mocked(classesService.addTeacherToClassService).mockResolvedValue({
      id: 'link-id',
      classId: IDS.class,
      teacherId: IDS.teacher,
      createdAt: new Date(),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/school-classes/class-id/teachers',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { id: IDS.teacher },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 409 se professor já está na turma', async () => {
    vi.mocked(classesService.addTeacherToClassService).mockRejectedValue(
      new Error('Teacher already in class'),
    )

    const response = await app.inject({
      method: 'POST',
      url: '/school-classes/class-id/teachers',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { id: IDS.teacher },
    })

    expect(response.statusCode).toBe(409)
  })
})

describe('POST /school-classes/:id/students', () => {
  it('retorna 201 ao adicionar aluno à turma', async () => {
    vi.mocked(classesService.addStudentToClassService).mockResolvedValue({
      id: 'link-id',
      classId: IDS.class,
      studentId: IDS.student,
      createdAt: new Date(),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/school-classes/class-id/students',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { id: IDS.student },
    })

    expect(response.statusCode).toBe(201)
  })
})

describe('DELETE /school-classes/:classId/students/:studentId', () => {
  it('retorna 204 ao remover aluno da turma', async () => {
    vi.mocked(classesService.removeStudentFromClassService).mockResolvedValue(undefined)

    const response = await app.inject({
      method: 'DELETE',
      url: '/school-classes/class-id/students/student-id',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(204)
  })
})

describe('GET /academic-periods', () => {
  it('retorna 200 para gestor', async () => {
    vi.mocked(periodsService.listAcademicPeriodsService).mockResolvedValue([mockPeriod])

    const response = await app.inject({
      method: 'GET',
      url: '/academic-periods',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
  })
})

describe('POST /academic-periods', () => {
  it('retorna 201 ao criar período letivo', async () => {
    vi.mocked(periodsService.createAcademicPeriodService).mockResolvedValue(mockPeriod)

    const response = await app.inject({
      method: 'POST',
      url: '/academic-periods',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '2025', startDate: '2025-02-01', endDate: '2025-12-15' },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 400 com datas inválidas', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/academic-periods',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '2025', startDate: 'nao-data', endDate: '2025-12-15' },
    })

    expect(response.statusCode).toBe(400)
  })
})
