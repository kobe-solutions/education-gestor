import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp, makeGestorToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/financial/financial.service', () => ({
  listTuitionsService: vi.fn(),
  listStudentTuitionsService: vi.fn(),
  createTuitionService: vi.fn(),
  registerPaymentService: vi.fn(),
}))

import * as financialService from '../../modules/financial/financial.service'

const IDS = {
  student: '00000000-0000-0000-0000-000000000001',
  tuition: '00000000-0000-0000-0000-000000000002',
}

let app: FastifyInstance
let gestorToken: string
let professorToken: string

const mockTuition = {
  id: IDS.tuition,
  schoolId: 'school-id',
  studentId: IDS.student,
  amount: '500.00',
  dueDate: '2025-05-10',
  paidAt: null,
  status: 'pending',
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

describe('GET /tuitions', () => {
  it('retorna 200 com lista para gestor', async () => {
    vi.mocked(financialService.listTuitionsService).mockResolvedValue([mockTuition])

    const response = await app.inject({
      method: 'GET',
      url: '/tuitions',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
  })

  it('retorna 401 sem token', async () => {
    const response = await app.inject({ method: 'GET', url: '/tuitions' })
    expect(response.statusCode).toBe(401)
  })

  it('retorna 403 para professor', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/tuitions',
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(response.statusCode).toBe(403)
  })
})

describe('GET /students/:id/tuitions', () => {
  it('retorna 200 com mensalidades do aluno', async () => {
    vi.mocked(financialService.listStudentTuitionsService).mockResolvedValue([mockTuition])

    const response = await app.inject({
      method: 'GET',
      url: '/students/student-id/tuitions',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
  })

  it('retorna 404 se aluno não existe', async () => {
    vi.mocked(financialService.listStudentTuitionsService).mockRejectedValue(
      new Error('Student not found'),
    )

    const response = await app.inject({
      method: 'GET',
      url: '/students/nao-existe/tuitions',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('POST /tuitions', () => {
  it('retorna 201 ao criar mensalidade', async () => {
    vi.mocked(financialService.createTuitionService).mockResolvedValue(mockTuition)

    const response = await app.inject({
      method: 'POST',
      url: '/tuitions',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { studentId: IDS.student, amount: 500, dueDate: '2025-05-10' },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 404 se aluno não existe', async () => {
    vi.mocked(financialService.createTuitionService).mockRejectedValue(new Error('Student not found'))

    const response = await app.inject({
      method: 'POST',
      url: '/tuitions',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { studentId: '00000000-0000-0000-0000-000000000099', amount: 500, dueDate: '2025-05-10' },
    })

    expect(response.statusCode).toBe(404)
  })

  it('retorna 400 com amount negativo', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tuitions',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { studentId: IDS.student, amount: -100, dueDate: '2025-05-10' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('retorna 400 com data inválida', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tuitions',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { studentId: IDS.student, amount: 500, dueDate: 'nao-e-data' },
    })

    expect(response.statusCode).toBe(400)
  })
})

describe('PATCH /tuitions/:id/pay', () => {
  it('retorna 200 ao registrar pagamento', async () => {
    const paidTuition = { ...mockTuition, status: 'paid', paidAt: new Date().toISOString() }
    vi.mocked(financialService.registerPaymentService).mockResolvedValue(paidTuition)

    const response = await app.inject({
      method: 'PATCH',
      url: '/tuitions/tuition-id/pay',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().status).toBe('paid')
  })

  it('retorna 409 se mensalidade já foi paga', async () => {
    vi.mocked(financialService.registerPaymentService).mockRejectedValue(
      new Error('Tuition already paid'),
    )

    const response = await app.inject({
      method: 'PATCH',
      url: '/tuitions/tuition-id/pay',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(409)
  })

  it('retorna 404 se mensalidade não existe', async () => {
    vi.mocked(financialService.registerPaymentService).mockRejectedValue(
      new Error('Tuition not found'),
    )

    const response = await app.inject({
      method: 'PATCH',
      url: '/tuitions/nao-existe/pay',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})
