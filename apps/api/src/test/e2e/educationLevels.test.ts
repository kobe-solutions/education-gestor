import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildTestApp, makeAdminToken, makeGestorToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/educationLevels/educationLevels.service', () => ({
  listEducationLevelsService: vi.fn(),
  getEducationLevelService: vi.fn(),
  createEducationLevelService: vi.fn(),
  updateEducationLevelService: vi.fn(),
  deleteEducationLevelService: vi.fn(),
}))

import * as service from '../../modules/educationLevels/educationLevels.service'

let app: FastifyInstance
let adminToken: string
let gestorToken: string
let professorToken: string

const mockLevel = {
  id: '00000000-0000-0000-0000-000000000001',
  schoolId: 'school-id',
  type: 'fundamental_1',
  modality: null,
  name: 'Ensino Fundamental 1',
  active: true,
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

beforeEach(() => vi.clearAllMocks())

describe('GET /education-levels', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/education-levels' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 403 para professor', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/education-levels',
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 200 para gestor', async () => {
    vi.mocked(service.listEducationLevelsService).mockResolvedValue([mockLevel])

    const res = await app.inject({
      method: 'GET',
      url: '/education-levels',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })
})

describe('GET /education-levels/:id', () => {
  it('retorna 200 quando existe', async () => {
    vi.mocked(service.getEducationLevelService).mockResolvedValue(mockLevel)

    const res = await app.inject({
      method: 'GET',
      url: `/education-levels/${mockLevel.id}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Ensino Fundamental 1')
  })

  it('retorna 404 quando não existe', async () => {
    vi.mocked(service.getEducationLevelService).mockRejectedValue(
      new Error('Education level not found'),
    )

    const res = await app.inject({
      method: 'GET',
      url: '/education-levels/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /education-levels', () => {
  it('retorna 403 para professor', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/education-levels',
      headers: { authorization: `Bearer ${professorToken}` },
      body: { type: 'fundamental_1', name: 'Fund. 1' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 201 para gestor com dados válidos', async () => {
    vi.mocked(service.createEducationLevelService).mockResolvedValue(mockLevel)

    const res = await app.inject({
      method: 'POST',
      url: '/education-levels',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { type: 'fundamental_1', name: 'Ensino Fundamental 1' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('Ensino Fundamental 1')
  })

  it('retorna 400 com type inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/education-levels',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { type: 'tipo_invalido', name: 'Teste' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 com nome ausente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/education-levels',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { type: 'fundamental_1' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 409 quando nome já existe', async () => {
    vi.mocked(service.createEducationLevelService).mockRejectedValue(
      new Error('Education level already exists with this name'),
    )

    const res = await app.inject({
      method: 'POST',
      url: '/education-levels',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { type: 'fundamental_1', name: 'Ensino Fundamental 1' },
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('PUT /education-levels/:id', () => {
  it('retorna 200 ao atualizar', async () => {
    const updated = { ...mockLevel, name: 'Fund. 1 Atualizado' }
    vi.mocked(service.updateEducationLevelService).mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PUT',
      url: `/education-levels/${mockLevel.id}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Fund. 1 Atualizado' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('Fund. 1 Atualizado')
  })

  it('retorna 404 quando não existe', async () => {
    vi.mocked(service.updateEducationLevelService).mockRejectedValue(
      new Error('Education level not found'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: '/education-levels/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Nome Válido' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('retorna 409 quando nome já existe em outro nível', async () => {
    vi.mocked(service.updateEducationLevelService).mockRejectedValue(
      new Error('Education level already exists with this name'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: `/education-levels/${mockLevel.id}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Ensino Médio' },
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('DELETE /education-levels/:id', () => {
  it('retorna 204 ao deletar', async () => {
    vi.mocked(service.deleteEducationLevelService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE',
      url: `/education-levels/${mockLevel.id}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 404 quando não existe', async () => {
    vi.mocked(service.deleteEducationLevelService).mockRejectedValue(
      new Error('Education level not found'),
    )

    const res = await app.inject({
      method: 'DELETE',
      url: '/education-levels/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
