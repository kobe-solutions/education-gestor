import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp, makeGestorToken, makeProfessorToken, makeSecretariaToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/academicPeriods/academicPeriods.service', () => ({
  listAcademicPeriodsService: vi.fn(),
  getAcademicPeriodService: vi.fn(),
  createAcademicPeriodService: vi.fn(),
  updateAcademicPeriodService: vi.fn(),
  deleteAcademicPeriodService: vi.fn(),
}))

import * as academicPeriodsService from '../../modules/academicPeriods/academicPeriods.service'

const IDS = {
  period: '00000000-0000-0000-0000-000000000001',
}

let app: FastifyInstance
let gestorToken: string
let professorToken: string
let secretariaToken: string

const mockPeriod = {
  id: IDS.period,
  schoolId: 'school-id',
  name: '2025',
  startDate: '2025-02-01',
  endDate: '2025-12-15',
  active: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

beforeAll(async () => {
  app = await buildTestApp()
  gestorToken = makeGestorToken(app)
  professorToken = makeProfessorToken(app)
  secretariaToken = makeSecretariaToken(app)
})

afterAll(async () => {
  await app.close()
})

describe('GET /academic-periods', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/academic-periods' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 200 para gestor', async () => {
    vi.mocked(academicPeriodsService.listAcademicPeriodsService).mockResolvedValue([mockPeriod])

    const res = await app.inject({
      method: 'GET',
      url: '/academic-periods',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })

  it('retorna 403 para professor (sem permissão)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/academic-periods',
      headers: { authorization: `Bearer ${professorToken}` },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('GET /academic-periods/:id', () => {
  it('retorna 200 quando período existe', async () => {
    vi.mocked(academicPeriodsService.getAcademicPeriodService).mockResolvedValue(mockPeriod)

    const res = await app.inject({
      method: 'GET',
      url: `/academic-periods/${IDS.period}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('2025')
  })

  it('retorna 404 quando período não existe', async () => {
    vi.mocked(academicPeriodsService.getAcademicPeriodService).mockRejectedValue(
      new Error('Academic period not found'),
    )

    const res = await app.inject({
      method: 'GET',
      url: '/academic-periods/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /academic-periods', () => {
  it('retorna 201 para gestor com dados válidos', async () => {
    vi.mocked(academicPeriodsService.createAcademicPeriodService).mockResolvedValue(mockPeriod)

    const res = await app.inject({
      method: 'POST',
      url: '/academic-periods',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '2025', startDate: '2025-02-01', endDate: '2025-12-15' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('2025')
  })

  it('retorna 400 com body inválido (sem endDate)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/academic-periods',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '2025', startDate: '2025-02-01' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 com datas no formato errado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/academic-periods',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '2025', startDate: '01/02/2025', endDate: '15/12/2025' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PUT /academic-periods/:id', () => {
  it('retorna 200 ao atualizar active para true', async () => {
    const updated = { ...mockPeriod, active: true }
    vi.mocked(academicPeriodsService.updateAcademicPeriodService).mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PUT',
      url: `/academic-periods/${IDS.period}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { active: true },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().active).toBe(true)
  })

  it('retorna 404 quando período não existe', async () => {
    vi.mocked(academicPeriodsService.updateAcademicPeriodService).mockRejectedValue(
      new Error('Academic period not found'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: '/academic-periods/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { active: true },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /academic-periods/:id', () => {
  it('retorna 204 ao deletar', async () => {
    vi.mocked(academicPeriodsService.deleteAcademicPeriodService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE',
      url: `/academic-periods/${IDS.period}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 404 quando período não existe', async () => {
    vi.mocked(academicPeriodsService.deleteAcademicPeriodService).mockRejectedValue(
      new Error('Academic period not found'),
    )

    const res = await app.inject({
      method: 'DELETE',
      url: '/academic-periods/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
