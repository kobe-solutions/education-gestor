import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { buildTestApp, makeGestorToken, makeAdminToken, makeSecretariaToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/dashboard/dashboard.repository', () => ({
  getSchoolMetricsRepository: vi.fn(),
  getAdminMetricsRepository: vi.fn(),
  getAdminActivityRepository: vi.fn(),
  getRegistrationStatusRepository: vi.fn(),
}))

import * as dashboardRepo from '../../modules/dashboard/dashboard.repository'

const IDS = { school: '00000000-0000-0000-0000-000000000002' }

let app: FastifyInstance
let gestorToken: string
let adminToken: string
let secretariaToken: string

beforeAll(async () => {
  app = await buildTestApp()
  gestorToken = makeGestorToken(app, IDS.school)
  adminToken = makeAdminToken(app)
  secretariaToken = makeSecretariaToken(app)
})

beforeEach(() => vi.clearAllMocks())

afterAll(async () => {
  await app.close()
})

const mockRegistrationStatus = {
  data: [
    {
      teacherId: 'teacher-1',
      teacherName: 'Professor Alpha',
      classes: [
        {
          classId: 'class-1',
          className: 'Turma A',
          subjects: [
            {
              subjectId: 'sub-1',
              subjectName: 'Matematica',
              weekDay: 'monday',
              periodName: '1o Periodo',
              periodStartTime: '08:00',
              periodEndTime: '08:50',
              attendanceRegistered: true,
              gradesRegistered: false,
            },
          ],
        },
      ],
    },
  ],
  total: 1,
  summary: { totalSlots: 1, attendanceRegistered: 1, gradesRegistered: 0 },
}

describe('GET /dashboard/registration-status', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/dashboard/registration-status' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 200 com dados para gestor', async () => {
    vi.mocked(dashboardRepo.getRegistrationStatusRepository).mockResolvedValue(mockRegistrationStatus)

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard/registration-status',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('total')
    expect(body).toHaveProperty('summary')
    expect(body.summary.totalSlots).toBe(1)
    expect(body.summary.attendanceRegistered).toBe(1)
    expect(body.summary.gradesRegistered).toBe(0)
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.data[0].teacherName).toBe('Professor Alpha')
  })

  it('retorna 200 com filtro de professor', async () => {
    vi.mocked(dashboardRepo.getRegistrationStatusRepository).mockResolvedValue(mockRegistrationStatus)

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard/registration-status?teacherId=teacher-1',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(dashboardRepo.getRegistrationStatusRepository).toHaveBeenCalledWith(
      IDS.school,
      expect.objectContaining({ teacherId: 'teacher-1' }),
      expect.objectContaining({ limit: 50, offset: 0 }),
    )
  })

  it('retorna 200 com filtro de turma', async () => {
    vi.mocked(dashboardRepo.getRegistrationStatusRepository).mockResolvedValue(mockRegistrationStatus)

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard/registration-status?classId=class-1',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(dashboardRepo.getRegistrationStatusRepository).toHaveBeenCalledWith(
      IDS.school,
      expect.objectContaining({ classId: 'class-1' }),
      expect.objectContaining({ limit: 50, offset: 0 }),
    )
  })

  it('retorna 200 com ambos os filtros', async () => {
    vi.mocked(dashboardRepo.getRegistrationStatusRepository).mockResolvedValue(mockRegistrationStatus)

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard/registration-status?teacherId=teacher-1&classId=class-1',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(dashboardRepo.getRegistrationStatusRepository).toHaveBeenCalledWith(
      IDS.school,
      { teacherId: 'teacher-1', classId: 'class-1' },
      expect.objectContaining({ limit: 50, offset: 0 }),
    )
  })

  it('retorna 200 com dados vazios quando nao ha aulas', async () => {
    vi.mocked(dashboardRepo.getRegistrationStatusRepository).mockResolvedValue({
      data: [],
      total: 0,
      summary: { totalSlots: 0, attendanceRegistered: 0, gradesRegistered: 0 },
    })

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard/registration-status',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(0)
    expect(body.total).toBe(0)
    expect(body.summary.totalSlots).toBe(0)
  })

  it('aplica paginação com page e limit', async () => {
    vi.mocked(dashboardRepo.getRegistrationStatusRepository).mockResolvedValue(mockRegistrationStatus)

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard/registration-status?page=2&limit=10',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(dashboardRepo.getRegistrationStatusRepository).toHaveBeenCalledWith(
      IDS.school,
      {},
      { limit: 10, offset: 10 },
    )
  })

  it('limit máximo é 200', async () => {
    vi.mocked(dashboardRepo.getRegistrationStatusRepository).mockResolvedValue(mockRegistrationStatus)

    await app.inject({
      method: 'GET',
      url: '/dashboard/registration-status?limit=500',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(dashboardRepo.getRegistrationStatusRepository).toHaveBeenCalledWith(
      IDS.school,
      {},
      { limit: 200, offset: 0 },
    )
  })

  it('page inválido usa padrão 1', async () => {
    vi.mocked(dashboardRepo.getRegistrationStatusRepository).mockResolvedValue(mockRegistrationStatus)

    await app.inject({
      method: 'GET',
      url: '/dashboard/registration-status?page=abc',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(dashboardRepo.getRegistrationStatusRepository).toHaveBeenCalledWith(
      IDS.school,
      {},
      { limit: 50, offset: 0 },
    )
  })
})
