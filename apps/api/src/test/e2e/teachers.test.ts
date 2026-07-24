import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp, makeGestorToken, makeAdminToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/teachers/teachers.service', () => ({
  listTeachersService: vi.fn(),
  getTeacherService: vi.fn(),
  createTeacherService: vi.fn(),
  updateTeacherService: vi.fn(),
  deleteTeacherService: vi.fn(),
}))

import * as teachersService from '../../modules/teachers/teachers.service'

let app: FastifyInstance
let gestorToken: string
let adminToken: string
let professorToken: string

const mockTeacher = {
  id: 'teacher-id',
  schoolId: 'school-id',
  name: 'Prof. Ana',
  email: 'ana@escola.com',
  role: 'professor',
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeAll(async () => {
  app = await buildTestApp()
  gestorToken = makeGestorToken(app)
  adminToken = makeAdminToken(app)
  professorToken = makeProfessorToken(app)
})

afterAll(async () => {
  await app.close()
})

describe('GET /teachers', () => {
  it('retorna 200 para gestor', async () => {
    vi.mocked(teachersService.listTeachersService).mockResolvedValue([mockTeacher] as any)

    const response = await app.inject({
      method: 'GET',
      url: '/teachers',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
  })

  it('retorna 401 sem token', async () => {
    const response = await app.inject({ method: 'GET', url: '/teachers' })
    expect(response.statusCode).toBe(401)
  })

  it('retorna 200 para professor (lista professores)', async () => {
    vi.mocked(teachersService.listTeachersService).mockResolvedValue({ data: [mockTeacher], total: 1 } as any)

    const response = await app.inject({
      method: 'GET',
      url: '/teachers',
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(response.statusCode).toBe(200)
  })
})

describe('GET /teachers/:id', () => {
  it('retorna 200 quando professor existe', async () => {
    vi.mocked(teachersService.getTeacherService).mockResolvedValue(mockTeacher as any)

    const response = await app.inject({
      method: 'GET',
      url: '/teachers/teacher-id',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().id).toBe('teacher-id')
  })

  it('retorna 404 quando professor não existe', async () => {
    vi.mocked(teachersService.getTeacherService).mockRejectedValue(new Error('Teacher not found'))

    const response = await app.inject({
      method: 'GET',
      url: '/teachers/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('POST /teachers', () => {
  it('retorna 201 ao criar professor', async () => {
    vi.mocked(teachersService.createTeacherService).mockResolvedValue(mockTeacher as any)

    const response = await app.inject({
      method: 'POST',
      url: '/teachers',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Prof. Ana', email: 'ana@escola.com', password: 'senha123!' },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 409 se email já existe', async () => {
    vi.mocked(teachersService.createTeacherService).mockRejectedValue(
      new Error('Teacher already exists with this email'),
    )

    const response = await app.inject({
      method: 'POST',
      url: '/teachers',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Outro', email: 'ana@escola.com', password: 'senha123!' },
    })

    expect(response.statusCode).toBe(409)
  })

  it('retorna 400 com body inválido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/teachers',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'A', email: 'nao-e-email' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('retorna 401 sem token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/teachers',
      body: { name: 'Ana', email: 'ana@escola.com', password: 'senha123!' },
    })
    expect(response.statusCode).toBe(401)
  })
})

describe('PUT /teachers/:id', () => {
  it('retorna 200 ao atualizar professor', async () => {
    vi.mocked(teachersService.updateTeacherService).mockResolvedValue({
      ...mockTeacher,
      name: 'Prof. Ana Maria',
    } as any)

    const response = await app.inject({
      method: 'PUT',
      url: '/teachers/teacher-id',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Prof. Ana Maria' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().name).toBe('Prof. Ana Maria')
  })

  it('retorna 404 quando professor não existe', async () => {
    vi.mocked(teachersService.updateTeacherService).mockRejectedValue(new Error('Teacher not found'))

    const response = await app.inject({
      method: 'PUT',
      url: '/teachers/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Nome Atualizado' },
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('DELETE /teachers/:id', () => {
  it('retorna 204 ao deletar professor', async () => {
    vi.mocked(teachersService.deleteTeacherService).mockResolvedValue(undefined)

    const response = await app.inject({
      method: 'DELETE',
      url: '/teachers/teacher-id',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(204)
  })

  it('retorna 404 quando professor não existe', async () => {
    vi.mocked(teachersService.deleteTeacherService).mockRejectedValue(new Error('Teacher not found'))

    const response = await app.inject({
      method: 'DELETE',
      url: '/teachers/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})
