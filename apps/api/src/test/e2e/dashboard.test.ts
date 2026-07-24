import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { buildTestApp, makeAdminToken, makeGestorToken, makeSecretariaToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/dashboard/dashboard.repository', () => ({
  getSchoolMetricsRepository: vi.fn(),
  getAdminMetricsRepository: vi.fn(),
}))

import * as dashboardRepo from '../../modules/dashboard/dashboard.repository'

const IDS = {
  secretaria: '00000000-0000-0000-0000-000000000001',
  school: '00000000-0000-0000-0000-000000000002',
}

let app: FastifyInstance
let adminToken: string
let gestorToken: string
let secretariaToken: string
let secretariaWithSchoolToken: string

const mockSchoolMetrics = {
  studentsCount: 42,
  teachersCount: 8,
  classesCount: 5,
  tuitions: {
    pending: { count: 10, total: '5000.00' },
    paid: { count: 30, total: '15000.00' },
    overdue: { count: 2, total: '1000.00' },
  },
  upcomingTuitions: [],
}

const mockAdminMetrics = {
  secretariasCount: 3,
  secretariasActive: 2,
  schoolsCount: 7,
  studentsCount: 200,
  studentsByStatus: { active: 180, inactive: 15, transferred: 3, cancelled: 2 },
  teachersCount: 20,
  teachersByStatus: { ativo: 18, inativo: 1, licenca: 1 },
  classesCount: 12,
  tuitions: {
    pending: { count: 40, total: '20000' },
    paid: { count: 150, total: '75000' },
    overdue: { count: 10, total: '5000' },
  },
  topSchools: [],
  recentActivity: [],
}

beforeAll(async () => {
  app = await buildTestApp()
  adminToken = makeAdminToken(app)
  gestorToken = makeGestorToken(app, IDS.school)
  secretariaToken = makeSecretariaToken(app, IDS.secretaria)
  secretariaWithSchoolToken = makeSecretariaToken(app, IDS.secretaria)
})

beforeEach(() => vi.clearAllMocks())

afterAll(async () => {
  await app.close()
})

describe('GET /dashboard', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/dashboard' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna métricas de admin para role admin', async () => {
    vi.mocked(dashboardRepo.getAdminMetricsRepository).mockResolvedValue(mockAdminMetrics)

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('secretariasCount', 3)
    expect(body).toHaveProperty('schoolsCount', 7)
    expect(body).toHaveProperty('studentsCount', 200)
    expect(body).toHaveProperty('secretariasActive', 2)
    expect(dashboardRepo.getAdminMetricsRepository).toHaveBeenCalled()
    expect(dashboardRepo.getSchoolMetricsRepository).not.toHaveBeenCalled()
  })

  it('retorna métricas da escola para gestor', async () => {
    vi.mocked(dashboardRepo.getSchoolMetricsRepository).mockResolvedValue(mockSchoolMetrics)

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('studentsCount', 42)
    expect(body).toHaveProperty('teachersCount', 8)
    expect(body).toHaveProperty('classesCount', 5)
    expect(body.tuitions.pending.count).toBe(10)
    expect(body.tuitions.paid.count).toBe(30)
    expect(body.tuitions.overdue.count).toBe(2)
    expect(dashboardRepo.getSchoolMetricsRepository).toHaveBeenCalledWith(IDS.school)
  })

  it('retorna zeros para secretaria sem X-School-Id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/dashboard',
      headers: { authorization: `Bearer ${secretariaToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.studentsCount).toBe(0)
    expect(body.teachersCount).toBe(0)
    expect(body.classesCount).toBe(0)
    expect(dashboardRepo.getSchoolMetricsRepository).not.toHaveBeenCalled()
  })

  it('retorna métricas da escola para secretaria com X-School-Id', async () => {
    vi.mocked(dashboardRepo.getSchoolMetricsRepository).mockResolvedValue(mockSchoolMetrics)

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard',
      headers: {
        authorization: `Bearer ${secretariaWithSchoolToken}`,
        'x-school-id': IDS.school,
      },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().studentsCount).toBe(42)
    expect(dashboardRepo.getSchoolMetricsRepository).toHaveBeenCalledWith(IDS.school)
  })

  it('retorna upcomingTuitions como array', async () => {
    const metricsWithUpcoming = {
      ...mockSchoolMetrics,
      upcomingTuitions: [
        {
          id: 'tuition-id',
          studentId: 'student-id',
          studentName: 'João Silva',
          amount: '500.00',
          dueDate: '2025-05-20',
          status: 'pending',
        },
      ],
    }
    vi.mocked(dashboardRepo.getSchoolMetricsRepository).mockResolvedValue(metricsWithUpcoming)

    const res = await app.inject({
      method: 'GET',
      url: '/dashboard',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().upcomingTuitions).toHaveLength(1)
    expect(res.json().upcomingTuitions[0].studentName).toBe('João Silva')
  })
})
