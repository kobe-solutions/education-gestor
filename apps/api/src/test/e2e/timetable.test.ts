import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildTestApp, makeGestorToken, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/timetable/timetable.service', () => ({
  listTimetableSlotsService: vi.fn(),
  listAllTimetableSlotsService: vi.fn(),
  getTimetableSlotService: vi.fn(),
  createTimetableSlotService: vi.fn(),
  updateTimetableSlotService: vi.fn(),
  deleteTimetableSlotService: vi.fn(),
}))

vi.mock('../../modules/timetable/timetable.repository', () => ({
  listTimetableSlotsByTeacherRepository: vi.fn(),
}))

import * as service from '../../modules/timetable/timetable.service'
import * as repository from '../../modules/timetable/timetable.repository'

let app: FastifyInstance
let gestorToken: string
let professorToken: string

const IDS = {
  slot: '00000000-0000-0000-0000-000000000001',
  class: '00000000-0000-0000-0000-000000000002',
  academicYear: '00000000-0000-0000-0000-000000000003',
  classPeriod: '00000000-0000-0000-0000-000000000004',
  subject: '00000000-0000-0000-0000-000000000005',
  teacher: '00000000-0000-0000-0000-000000000006',
}

const mockSlot = {
  id: IDS.slot,
  schoolId: 'school-id',
  classId: IDS.class,
  academicYearId: IDS.academicYear,
  classPeriodId: IDS.classPeriod,
  subjectId: IDS.subject,
  teacherId: IDS.teacher,
  weekDay: 'monday',
  createdAt: new Date(),
  subject: { id: IDS.subject, name: 'Matemática' },
  teacher: { id: IDS.teacher, name: 'Prof. João' },
  classPeriod: { id: IDS.classPeriod, name: '1º Horário', startTime: '08:00', endTime: '08:50', order: 1 },
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
  it('retorna 200 sem classId (lista todos)', async () => {
    vi.mocked(service.listAllTimetableSlotsService).mockResolvedValue([mockSlot] as any)

    const res = await app.inject({
      method: 'GET',
      url: '/timetable-slots',
      headers: { authorization: `Bearer ${gestorToken}` },
    })
    expect(res.statusCode).toBe(200)
  })

  it('retorna 200 para professor (apenas seus slots)', async () => {
    vi.mocked(repository.listTimetableSlotsByTeacherRepository).mockResolvedValue([mockSlot] as any)

    const res = await app.inject({
      method: 'GET',
      url: '/timetable-slots',
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(repository.listTimetableSlotsByTeacherRepository).toHaveBeenCalledWith('school-id', 'professor-id')
  })

  it('retorna 200 com slots da turma', async () => {
    vi.mocked(service.listTimetableSlotsService).mockResolvedValue([mockSlot] as any)

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
    academicYearId: IDS.academicYear,
    classPeriodId: IDS.classPeriod,
    subjectId: IDS.subject,
    teacherId: IDS.teacher,
    weekDay: 'monday',
  }

  it('retorna 201 com dados válidos', async () => {
    vi.mocked(service.createTimetableSlotService).mockResolvedValue(mockSlot as any)

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

  it('retorna 201 para professor (cria horário)', async () => {
    vi.mocked(service.createTimetableSlotService).mockResolvedValue(mockSlot as any)

    const res = await app.inject({
      method: 'POST',
      url: '/timetable-slots',
      headers: { authorization: `Bearer ${professorToken}` },
      body: validBody,
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('PUT /timetable-slots/:id', () => {
  it('retorna 200 ao atualizar', async () => {
    const newPeriodId = '00000000-0000-0000-0000-000000000099'
    const updated = { ...mockSlot, classPeriodId: newPeriodId }
    vi.mocked(service.updateTimetableSlotService).mockResolvedValue(updated as any)

    const res = await app.inject({
      method: 'PUT',
      url: `/timetable-slots/${IDS.slot}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { classPeriodId: newPeriodId },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().classPeriodId).toBe(newPeriodId)
  })

  it('retorna 404 quando slot não existe', async () => {
    vi.mocked(service.updateTimetableSlotService).mockRejectedValue(
      new Error('Timetable slot not found'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: '/timetable-slots/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { classPeriodId: IDS.classPeriod },
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
      body: { teacherId: IDS.teacher },
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
