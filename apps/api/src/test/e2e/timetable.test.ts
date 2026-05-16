import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildTestApp, makeGestorToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/timetable/timetable.service', () => ({
  listTimetableSlotsService: vi.fn(),
  getTimetableSlotService: vi.fn(),
  createTimetableSlotService: vi.fn(),
  updateTimetableSlotService: vi.fn(),
  deleteTimetableSlotService: vi.fn(),
}))

import * as service from '../../modules/timetable/timetable.service'

let app: FastifyInstance
let gestorToken: string
let professorToken: string

const IDS = {
  slot: '00000000-0000-0000-0000-000000000001',
  class: '00000000-0000-0000-0000-000000000002',
  period: '00000000-0000-0000-0000-000000000003',
  subject: '00000000-0000-0000-0000-000000000004',
  teacher: '00000000-0000-0000-0000-000000000005',
}

const mockSlot = {
  id: IDS.slot,
  schoolId: 'school-id',
  classId: IDS.class,
  academicPeriodId: IDS.period,
  subjectId: IDS.subject,
  teacherId: IDS.teacher,
  weekDay: 'monday',
  startTime: '07:30',
  endTime: '08:20',
  createdAt: new Date().toISOString(),
  subject: { id: IDS.subject, name: 'Matemática' },
  teacher: { id: IDS.teacher, name: 'Prof. João' },
  academicPeriod: { id: IDS.period, name: '2025' },
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

describe('GET /timetable-slots', () => {
  it('retorna 400 sem classId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/timetable-slots',
      headers: { authorization: `Bearer ${gestorToken}` },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 403 para professor', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/timetable-slots?classId=${IDS.class}`,
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 200 com slots da turma', async () => {
    vi.mocked(service.listTimetableSlotsService).mockResolvedValue([mockSlot])

    const res = await app.inject({
      method: 'GET',
      url: `/timetable-slots?classId=${IDS.class}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
    expect(service.listTimetableSlotsService).toHaveBeenCalledWith('school-id', IDS.class)
  })
})

describe('POST /timetable-slots', () => {
  const validBody = {
    classId: IDS.class,
    academicPeriodId: IDS.period,
    subjectId: IDS.subject,
    teacherId: IDS.teacher,
    weekDay: 'monday',
    startTime: '07:30',
    endTime: '08:20',
  }

  it('retorna 201 com dados válidos', async () => {
    vi.mocked(service.createTimetableSlotService).mockResolvedValue(mockSlot)

    const res = await app.inject({
      method: 'POST',
      url: '/timetable-slots',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: validBody,
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().weekDay).toBe('monday')
  })

  it('retorna 400 com weekDay inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/timetable-slots',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { ...validBody, weekDay: 'domingo' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 com startTime em formato inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/timetable-slots',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { ...validBody, startTime: '7h30' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 409 quando professor já tem slot neste horário', async () => {
    vi.mocked(service.createTimetableSlotService).mockRejectedValue(
      new Error('Teacher already has a slot at this time'),
    )

    const res = await app.inject({
      method: 'POST',
      url: '/timetable-slots',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: validBody,
    })

    expect(res.statusCode).toBe(409)
  })

  it('retorna 403 para professor', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/timetable-slots',
      headers: { authorization: `Bearer ${professorToken}` },
      body: validBody,
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('PUT /timetable-slots/:id', () => {
  it('retorna 200 ao atualizar', async () => {
    const updated = { ...mockSlot, startTime: '08:30' }
    vi.mocked(service.updateTimetableSlotService).mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PUT',
      url: `/timetable-slots/${IDS.slot}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { startTime: '08:30' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().startTime).toBe('08:30')
  })

  it('retorna 404 quando slot não existe', async () => {
    vi.mocked(service.updateTimetableSlotService).mockRejectedValue(
      new Error('Timetable slot not found'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: '/timetable-slots/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { endTime: '09:00' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('retorna 409 ao atualizar com conflito de professor', async () => {
    vi.mocked(service.updateTimetableSlotService).mockRejectedValue(
      new Error('Teacher already has a slot at this time'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: `/timetable-slots/${IDS.slot}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { startTime: '09:00' },
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('DELETE /timetable-slots/:id', () => {
  it('retorna 204 ao deletar', async () => {
    vi.mocked(service.deleteTimetableSlotService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE',
      url: `/timetable-slots/${IDS.slot}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 404 quando não existe', async () => {
    vi.mocked(service.deleteTimetableSlotService).mockRejectedValue(
      new Error('Timetable slot not found'),
    )

    const res = await app.inject({
      method: 'DELETE',
      url: '/timetable-slots/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
