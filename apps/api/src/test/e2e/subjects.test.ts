import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp, makeAdminToken, makeGestorToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/subjects/subjects.service', () => ({
  listSubjectsService: vi.fn(),
  getSubjectService: vi.fn(),
  createSubjectService: vi.fn(),
  updateSubjectService: vi.fn(),
  deleteSubjectService: vi.fn(),
}))

import * as subjectsService from '../../modules/subjects/subjects.service'

const IDS = {
  subject: '00000000-0000-0000-0000-000000000001',
}

let app: FastifyInstance
let adminToken: string
let gestorToken: string
let professorToken: string

const mockSubject = {
  id: IDS.subject,
  schoolId: 'school-id',
  name: 'Matemática',
  code: 'MAT',
  weeklyHours: 5,
  createdAt: new Date().toISOString(),
}

beforeAll(async () => {
  app = await buildTestApp()
  adminToken = makeAdminToken(app)
  gestorToken = makeGestorToken(app)
  professorToken = makeProfessorToken(app)
})

afterAll(async () => {
  await app.close()
})

describe('GET /subjects', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/subjects' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 403 para professor', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/subjects',
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 200 para gestor', async () => {
    vi.mocked(subjectsService.listSubjectsService).mockResolvedValue([mockSubject])

    const res = await app.inject({
      method: 'GET',
      url: '/subjects',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })
})

describe('GET /subjects/:id', () => {
  it('retorna 200 quando disciplina existe', async () => {
    vi.mocked(subjectsService.getSubjectService).mockResolvedValue(mockSubject)

    const res = await app.inject({
      method: 'GET',
      url: `/subjects/${IDS.subject}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Matemática')
  })

  it('retorna 404 quando disciplina não existe', async () => {
    vi.mocked(subjectsService.getSubjectService).mockRejectedValue(new Error('Subject not found'))

    const res = await app.inject({
      method: 'GET',
      url: '/subjects/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /subjects', () => {
  it('retorna 403 para professor', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/subjects',
      headers: { authorization: `Bearer ${professorToken}` },
      body: { name: 'Matemática', weeklyHours: 5 },
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 201 para gestor com dados válidos', async () => {
    vi.mocked(subjectsService.createSubjectService).mockResolvedValue(mockSubject)

    const res = await app.inject({
      method: 'POST',
      url: '/subjects',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Matemática', weeklyHours: 5 },
    })

    expect(res.statusCode).toBe(201)
  })

  it('retorna 400 com weeklyHours ausente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/subjects',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Matemática' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 409 quando nome já existe', async () => {
    vi.mocked(subjectsService.createSubjectService).mockRejectedValue(
      new Error('Subject already exists with this name'),
    )

    const res = await app.inject({
      method: 'POST',
      url: '/subjects',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Matemática', weeklyHours: 5 },
    })

    expect(res.statusCode).toBe(409)
  })

  it('retorna 409 quando código já existe', async () => {
    vi.mocked(subjectsService.createSubjectService).mockRejectedValue(
      new Error('Subject already exists with this code'),
    )

    const res = await app.inject({
      method: 'POST',
      url: '/subjects',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Nova Matéria', code: 'MAT', weeklyHours: 3 },
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('PUT /subjects/:id', () => {
  it('retorna 200 ao atualizar', async () => {
    const updated = { ...mockSubject, name: 'Matemática Avançada' }
    vi.mocked(subjectsService.updateSubjectService).mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PUT',
      url: `/subjects/${IDS.subject}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Matemática Avançada' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Matemática Avançada')
  })

  it('retorna 404 quando disciplina não existe', async () => {
    vi.mocked(subjectsService.updateSubjectService).mockRejectedValue(new Error('Subject not found'))

    const res = await app.inject({
      method: 'PUT',
      url: '/subjects/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Nome Válido' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('retorna 409 quando nome já existe em outra disciplina', async () => {
    vi.mocked(subjectsService.updateSubjectService).mockRejectedValue(
      new Error('Subject already exists with this name'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: `/subjects/${IDS.subject}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Português' },
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('DELETE /subjects/:id', () => {
  it('retorna 204 ao deletar', async () => {
    vi.mocked(subjectsService.deleteSubjectService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE',
      url: `/subjects/${IDS.subject}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 404 quando disciplina não existe', async () => {
    vi.mocked(subjectsService.deleteSubjectService).mockRejectedValue(new Error('Subject not found'))

    const res = await app.inject({
      method: 'DELETE',
      url: '/subjects/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
