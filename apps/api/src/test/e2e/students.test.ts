import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp, makeGestorToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/students/students.service', () => ({
  listStudentsService: vi.fn(),
  getStudentService: vi.fn(),
  createStudentService: vi.fn(),
  updateStudentService: vi.fn(),
  deleteStudentService: vi.fn(),
  addGuardianService: vi.fn(),
  listGuardiansService: vi.fn(),
}))

import * as studentsService from '../../modules/students/students.service'

let app: FastifyInstance
let gestorToken: string
let professorToken: string

const mockStudent = {
  id: 'student-id',
  schoolId: 'school-id',
  name: 'João Silva',
  email: 'joao@test.com',
  birthDate: '2005-03-15',
  enrollmentCode: 'MAT001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockGuardian = {
  id: 'guardian-id',
  studentId: 'student-id',
  name: 'Maria Silva',
  phone: '11999999999',
  relationship: 'mãe',
  createdAt: new Date().toISOString(),
}

beforeAll(async () => {
  app = await buildTestApp()
  gestorToken = makeGestorToken(app)
  professorToken = makeProfessorToken(app)
})

afterAll(async () => {
  await app.close()
})

describe('GET /students', () => {
  it('retorna 200 com lista para gestor', async () => {
    vi.mocked(studentsService.listStudentsService).mockResolvedValue([mockStudent])

    const response = await app.inject({
      method: 'GET',
      url: '/students',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
  })

  it('retorna 401 sem token', async () => {
    const response = await app.inject({ method: 'GET', url: '/students' })
    expect(response.statusCode).toBe(401)
  })

  it('retorna 403 para professor', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/students',
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(response.statusCode).toBe(403)
  })
})

describe('GET /students/:id', () => {
  it('retorna 200 quando aluno existe', async () => {
    vi.mocked(studentsService.getStudentService).mockResolvedValue(mockStudent)

    const response = await app.inject({
      method: 'GET',
      url: '/students/student-id',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().enrollmentCode).toBe('MAT001')
  })

  it('retorna 404 quando aluno não existe', async () => {
    vi.mocked(studentsService.getStudentService).mockRejectedValue(new Error('Student not found'))

    const response = await app.inject({
      method: 'GET',
      url: '/students/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('POST /students', () => {
  it('retorna 201 ao criar aluno', async () => {
    vi.mocked(studentsService.createStudentService).mockResolvedValue(mockStudent)

    const response = await app.inject({
      method: 'POST',
      url: '/students',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'João Silva', enrollmentCode: 'MAT001' },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 409 se matrícula já existe', async () => {
    vi.mocked(studentsService.createStudentService).mockRejectedValue(
      new Error('Enrollment code already in use'),
    )

    const response = await app.inject({
      method: 'POST',
      url: '/students',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Outro', enrollmentCode: 'MAT001' },
    })

    expect(response.statusCode).toBe(409)
  })

  it('retorna 400 com body inválido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/students',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'A' }, // sem enrollmentCode
    })

    expect(response.statusCode).toBe(400)
  })
})

describe('PUT /students/:id', () => {
  it('retorna 200 ao atualizar aluno', async () => {
    vi.mocked(studentsService.updateStudentService).mockResolvedValue({
      ...mockStudent,
      name: 'João Atualizado',
    })

    const response = await app.inject({
      method: 'PUT',
      url: '/students/student-id',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'João Atualizado' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().name).toBe('João Atualizado')
  })
})

describe('DELETE /students/:id', () => {
  it('retorna 204 ao deletar aluno', async () => {
    vi.mocked(studentsService.deleteStudentService).mockResolvedValue(undefined)

    const response = await app.inject({
      method: 'DELETE',
      url: '/students/student-id',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(204)
  })

  it('retorna 404 quando aluno não existe', async () => {
    vi.mocked(studentsService.deleteStudentService).mockRejectedValue(new Error('Student not found'))

    const response = await app.inject({
      method: 'DELETE',
      url: '/students/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('GET /students/:id/guardians', () => {
  it('retorna 200 com responsáveis do aluno', async () => {
    vi.mocked(studentsService.listGuardiansService).mockResolvedValue([mockGuardian])

    const response = await app.inject({
      method: 'GET',
      url: '/students/student-id/guardians',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
  })
})

describe('POST /students/:id/guardians', () => {
  it('retorna 201 ao adicionar responsável', async () => {
    vi.mocked(studentsService.addGuardianService).mockResolvedValue(mockGuardian)

    const response = await app.inject({
      method: 'POST',
      url: '/students/student-id/guardians',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Maria Silva', relationship: 'mãe', phone: '11999999999' },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 400 sem campo obrigatório', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/students/student-id/guardians',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'X' }, // sem relationship
    })

    expect(response.statusCode).toBe(400)
  })
})
