import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildTestApp, makeGestorToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/series/series.service', () => ({
  listSeriesService: vi.fn(),
  getSerieService: vi.fn(),
  createSerieService: vi.fn(),
  updateSerieService: vi.fn(),
  deleteSerieService: vi.fn(),
}))

import * as service from '../../modules/series/series.service'

let app: FastifyInstance
let gestorToken: string
let professorToken: string

const mockSerie = {
  id: '00000000-0000-0000-0000-000000000002',
  schoolId: 'school-id',
  educationLevelId: '00000000-0000-0000-0000-000000000001',
  name: '1º ano',
  order: 1,
  createdAt: new Date(),
  educationLevel: { id: '00000000-0000-0000-0000-000000000001', name: 'Ensino Fundamental 1', type: 'fundamental_1' },
}

beforeAll(async () => {
  app = await buildTestApp()
  gestorToken = makeGestorToken(app)
  professorToken = makeProfessorToken(app)
})

afterAll(async () => {
  await app.close()
})

beforeEach(() => vi.clearAllMocks())

describe('GET /series', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/series' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 403 para professor', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/series',
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 200 para gestor', async () => {
    vi.mocked(service.listSeriesService).mockResolvedValue([mockSerie] as any)

    const res = await app.inject({
      method: 'GET',
      url: '/series',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })

  it('filtra por educationLevelId via query param', async () => {
    vi.mocked(service.listSeriesService).mockResolvedValue([mockSerie] as any)

    const res = await app.inject({
      method: 'GET',
      url: `/series?educationLevelId=${mockSerie.educationLevelId}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(service.listSeriesService).toHaveBeenCalledWith('school-id', mockSerie.educationLevelId)
  })
})

describe('GET /series/:id', () => {
  it('retorna 200 quando existe', async () => {
    vi.mocked(service.getSerieService).mockResolvedValue(mockSerie as any)

    const res = await app.inject({
      method: 'GET',
      url: `/series/${mockSerie.id}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('1º ano')
  })

  it('retorna 404 quando não existe', async () => {
    vi.mocked(service.getSerieService).mockRejectedValue(new Error('Serie not found'))

    const res = await app.inject({
      method: 'GET',
      url: '/series/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /series', () => {
  it('retorna 201 com dados válidos', async () => {
    vi.mocked(service.createSerieService).mockResolvedValue(mockSerie as any)

    const res = await app.inject({
      method: 'POST',
      url: '/series',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { educationLevelId: mockSerie.educationLevelId, name: '1º ano', order: 1 },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('1º ano')
  })

  it('retorna 400 sem educationLevelId', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/series',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '1º ano' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 404 quando nível não existe', async () => {
    vi.mocked(service.createSerieService).mockRejectedValue(new Error('Education level not found'))

    const res = await app.inject({
      method: 'POST',
      url: '/series',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { educationLevelId: '00000000-0000-0000-0000-000000000099', name: '1º ano' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('retorna 409 quando nome já existe no nível', async () => {
    vi.mocked(service.createSerieService).mockRejectedValue(
      new Error('Serie already exists with this name in this level'),
    )

    const res = await app.inject({
      method: 'POST',
      url: '/series',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { educationLevelId: mockSerie.educationLevelId, name: '1º ano' },
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('PUT /series/:id', () => {
  it('retorna 200 ao atualizar', async () => {
    const updated = { ...mockSerie, name: '1º ano (tarde)' }
    vi.mocked(service.updateSerieService).mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PUT',
      url: `/series/${mockSerie.id}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '1º ano (tarde)' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('1º ano (tarde)')
  })

  it('retorna 404 quando não existe', async () => {
    vi.mocked(service.updateSerieService).mockRejectedValue(new Error('Serie not found'))

    const res = await app.inject({
      method: 'PUT',
      url: '/series/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Nome Válido' },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /series/:id', () => {
  it('retorna 204 ao deletar', async () => {
    vi.mocked(service.deleteSerieService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE',
      url: `/series/${mockSerie.id}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 404 quando não existe', async () => {
    vi.mocked(service.deleteSerieService).mockRejectedValue(new Error('Serie not found'))

    const res = await app.inject({
      method: 'DELETE',
      url: '/series/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
