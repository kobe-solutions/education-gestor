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
  year: '00000000-0000-0000-0000-000000000010',
  period: '00000000-0000-0000-0000-000000000001',
}

let app: FastifyInstance
let gestorToken: string
let professorToken: string
let secretariaToken: string

const mockPeriod = {
  id: IDS.period,
  schoolId: 'school-id',
  academicYearId: IDS.year,
  name: '1º Bimestre',
  type: 'bimestre',
  order: 1,
  startDate: '2025-02-01',
  endDate: '2025-04-30',
  gradeClosingDate: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
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

const BASE = `/academic-years/${IDS.year}/periods`

describe('GET /academic-years/:yearId/periods', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: BASE })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 200 para gestor', async () => {
    vi.mocked(academicPeriodsService.listAcademicPeriodsService).mockResolvedValue([mockPeriod] as any)

    const res = await app.inject({
      method: 'GET',
      url: BASE,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })

  it('retorna 200 para professor (leitura permitida)', async () => {
    vi.mocked(academicPeriodsService.listAcademicPeriodsService).mockResolvedValue([] as any)

    const res = await app.inject({
      method: 'GET',
      url: BASE,
      headers: { authorization: `Bearer ${professorToken}` },
    })

    expect(res.statusCode).toBe(200)
  })
})

describe('GET /academic-years/:yearId/periods/:id', () => {
  it('retorna 200 quando período existe', async () => {
    vi.mocked(academicPeriodsService.getAcademicPeriodService).mockResolvedValue(mockPeriod as any)

    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/${IDS.period}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('1º Bimestre')
  })

  it('retorna 404 quando período não existe', async () => {
    vi.mocked(academicPeriodsService.getAcademicPeriodService).mockRejectedValue(
      new Error('Academic period not found'),
    )

    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/nao-existe`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /academic-years/:yearId/periods', () => {
  it('retorna 201 para gestor com dados válidos', async () => {
    vi.mocked(academicPeriodsService.createAcademicPeriodService).mockResolvedValue(mockPeriod as any)

    const res = await app.inject({
      method: 'POST',
      url: BASE,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '1º Bimestre', type: 'bimestre', order: 1, startDate: '2025-02-01', endDate: '2025-04-30' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('1º Bimestre')
  })

  it('retorna 400 com body inválido (sem endDate)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: BASE,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '1º Bimestre', type: 'bimestre', order: 1, startDate: '2025-02-01' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 com datas no formato errado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: BASE,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '1º Bimestre', type: 'bimestre', order: 1, startDate: '01/02/2025', endDate: '30/04/2025' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PUT /academic-years/:yearId/periods/:id', () => {
  it('retorna 200 ao atualizar', async () => {
    const updated = { ...mockPeriod, name: '2º Bimestre' }
    vi.mocked(academicPeriodsService.updateAcademicPeriodService).mockResolvedValue(updated as any)

    const res = await app.inject({
      method: 'PUT',
      url: `${BASE}/${IDS.period}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: '2º Bimestre' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().name).toBe('2º Bimestre')
  })

  it('retorna 404 quando período não existe', async () => {
    vi.mocked(academicPeriodsService.updateAcademicPeriodService).mockRejectedValue(
      new Error('Academic period not found'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: `${BASE}/nao-existe`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Atualizado' },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /academic-years/:yearId/periods/:id', () => {
  it('retorna 204 ao deletar', async () => {
    vi.mocked(academicPeriodsService.deleteAcademicPeriodService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE',
      url: `${BASE}/${IDS.period}`,
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
      url: `${BASE}/nao-existe`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
