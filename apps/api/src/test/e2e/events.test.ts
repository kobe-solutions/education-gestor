import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import {
  buildTestApp,
  makeGestorToken,
  makeProfessorToken,
  makeSecretariaToken,
} from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/events/events.service', () => ({
  listEventsService: vi.fn(),
  getEventService: vi.fn(),
  createEventService: vi.fn(),
  updateEventService: vi.fn(),
  deleteEventService: vi.fn(),
}))

import * as eventsService from '../../modules/events/events.service'

const IDS = {
  event: '00000000-0000-0000-0000-000000000001',
}

let app: FastifyInstance
let gestorToken: string
let professorToken: string
let secretariaToken: string

const mockEvent = {
  id: IDS.event,
  schoolId: 'school-id',
  title: 'Festival de Inverno',
  category: 'festividade',
  date: '2025-07-15',
  startTime: '09:00',
  endTime: '17:00',
  allDay: false,
  location: 'Quadra',
  description: 'Evento anual da escola',
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeAll(async () => {
  app = await buildTestApp()
  gestorToken = makeGestorToken(app, 'school-a')
  professorToken = makeProfessorToken(app, 'school-a')
  secretariaToken = makeSecretariaToken(app)
})

afterAll(async () => {
  await app.close()
})

describe('GET /events', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/events' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 200 para professor (lê calendário da escola)', async () => {
    vi.mocked(eventsService.listEventsService).mockResolvedValue([mockEvent] as any)

    const res = await app.inject({
      method: 'GET',
      url: '/events',
      headers: { authorization: `Bearer ${professorToken}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
  })

  it('retorna 200 para gestor', async () => {
    vi.mocked(eventsService.listEventsService).mockResolvedValue([mockEvent] as any)

    const res = await app.inject({
      method: 'GET',
      url: '/events',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
    expect(eventsService.listEventsService).toHaveBeenCalledWith('school-a', {})
  })

  it('aplica escopo da escola selecionada pela secretaria via X-School-Id', async () => {
    vi.mocked(eventsService.listEventsService).mockResolvedValue([])

    const res = await app.inject({
      method: 'GET',
      url: '/events',
      headers: {
        authorization: `Bearer ${secretariaToken}`,
        'x-school-id': 'school-b',
      },
    })

    expect(res.statusCode).toBe(200)
    expect(eventsService.listEventsService).toHaveBeenCalledWith('school-b', {})
  })

  it('retorna 400 para secretaria sem X-School-Id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/events',
      headers: { authorization: `Bearer ${secretariaToken}` },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 com data inválida no filtro', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/events?from=invalid-date',
      headers: { authorization: `Bearer ${gestorToken}` },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /events/:id', () => {
  it('retorna 200 quando evento existe', async () => {
    vi.mocked(eventsService.getEventService).mockResolvedValue(mockEvent as any)

    const res = await app.inject({
      method: 'GET',
      url: `/events/${IDS.event}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().title).toBe('Festival de Inverno')
    expect(eventsService.getEventService).toHaveBeenCalledWith('school-a', IDS.event)
  })

  it('retorna 404 quando evento não existe', async () => {
    vi.mocked(eventsService.getEventService).mockRejectedValue(new Error('Event not found'))

    const res = await app.inject({
      method: 'GET',
      url: '/events/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /events', () => {
  it('retorna 403 para professor', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { authorization: `Bearer ${professorToken}` },
      body: { title: 'Evento', category: 'outro', date: '2025-07-15' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 201 para gestor com dados válidos', async () => {
    vi.mocked(eventsService.createEventService).mockResolvedValue(mockEvent as any)

    const res = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: {
        title: 'Festival de Inverno',
        category: 'festividade',
        date: '2025-07-15',
        startTime: '09:00',
        endTime: '17:00',
        allDay: false,
        location: 'Quadra',
        description: 'Evento anual da escola',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().title).toBe('Festival de Inverno')
    expect(eventsService.createEventService).toHaveBeenCalledWith('school-a', expect.anything())
  })

  it('retorna 400 com hora em formato inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { title: 'Evento', category: 'outro', date: '2025-07-15', startTime: '25:99' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 com data inválida', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { title: 'Evento', category: 'outro', date: '15/07/2025' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 400 sem título', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { category: 'outro', date: '2025-07-15' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 409 quando há conflito de horário', async () => {
    vi.mocked(eventsService.createEventService).mockRejectedValue(
      new Error('Event already exists at this time'),
    )

    const res = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { title: 'Evento', category: 'outro', date: '2025-07-15' },
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('PUT /events/:id', () => {
  it('retorna 200 ao atualizar', async () => {
    const updated = { ...mockEvent, title: 'Festival de Inverno 2025' }
    vi.mocked(eventsService.updateEventService).mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PUT',
      url: `/events/${IDS.event}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { title: 'Festival de Inverno 2025' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().title).toBe('Festival de Inverno 2025')
    expect(eventsService.updateEventService).toHaveBeenCalledWith('school-a', IDS.event, expect.anything())
  })

  it('retorna 404 quando evento não existe', async () => {
    vi.mocked(eventsService.updateEventService).mockRejectedValue(new Error('Event not found'))

    const res = await app.inject({
      method: 'PUT',
      url: '/events/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { title: 'Nome Válido' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('retorna 409 ao atualizar com conflito de horário', async () => {
    vi.mocked(eventsService.updateEventService).mockRejectedValue(
      new Error('Event already exists at this time'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: `/events/${IDS.event}`,
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { startTime: '10:00', endTime: '11:00' },
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('DELETE /events/:id', () => {
  it('retorna 204 ao deletar', async () => {
    vi.mocked(eventsService.deleteEventService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE',
      url: `/events/${IDS.event}`,
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(204)
    expect(eventsService.deleteEventService).toHaveBeenCalledWith('school-a', IDS.event)
  })

  it('retorna 404 quando evento não existe', async () => {
    vi.mocked(eventsService.deleteEventService).mockRejectedValue(new Error('Event not found'))

    const res = await app.inject({
      method: 'DELETE',
      url: '/events/nao-existe',
      headers: { authorization: `Bearer ${gestorToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
