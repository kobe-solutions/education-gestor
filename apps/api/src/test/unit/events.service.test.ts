import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listEventsService,
  getEventService,
  createEventService,
  updateEventService,
  deleteEventService,
} from '../../modules/events/events.service'
import * as repo from '../../modules/events/events.repository'

vi.mock('../../modules/events/events.repository')

const mockEvent = {
  id: 'event-id',
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

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(repo.findAllEventsRepository).mockResolvedValue([])
})

describe('listEventsService', () => {
  it('retorna eventos da escola', async () => {
    vi.mocked(repo.findAllEventsRepository).mockResolvedValue([mockEvent])

    const result = await listEventsService('school-id', { from: '2025-07-01' })

    expect(result).toHaveLength(1)
    expect(repo.findAllEventsRepository).toHaveBeenCalledWith('school-id', {
      from: '2025-07-01',
    })
  })
})

describe('getEventService', () => {
  it('retorna evento quando existe na escola', async () => {
    vi.mocked(repo.findEventByIdRepository).mockResolvedValue(mockEvent)

    const result = await getEventService('school-id', 'event-id')

    expect(result).toEqual(mockEvent)
    expect(repo.findEventByIdRepository).toHaveBeenCalledWith('school-id', 'event-id')
  })

  it('lança erro quando evento não existe', async () => {
    vi.mocked(repo.findEventByIdRepository).mockResolvedValue(undefined as any)

    await expect(getEventService('school-id', 'nao-existe')).rejects.toThrow('Event not found')
  })
})

describe('createEventService', () => {
  it('cria evento vinculado à escola', async () => {
    vi.mocked(repo.createEventRepository).mockResolvedValue(mockEvent)

    const result = await createEventService('school-id', {
      title: '  Festival de Inverno  ',
      category: 'festividade',
      date: '2025-07-15',
      startTime: '09:00',
      endTime: '17:00',
      allDay: false,
      location: 'Quadra',
      description: 'Evento anual da escola',
    })

    expect(result).toEqual(mockEvent)
    expect(repo.createEventRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: 'school-id',
        title: 'Festival de Inverno',
        category: 'festividade',
        date: '2025-07-15',
        startTime: '09:00',
        endTime: '17:00',
        allDay: false,
        location: 'Quadra',
      }),
    )
  })

  it('armazena null quando campos opcionais não são fornecidos', async () => {
    vi.mocked(repo.createEventRepository).mockResolvedValue({
      ...mockEvent,
      startTime: null,
      endTime: null,
      location: null,
      description: null,
    })

    await createEventService('school-id', {
      title: 'Feriado Municipal',
      category: 'feriado',
      date: '2025-06-10',
      allDay: true,
    })

    expect(repo.createEventRepository).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: 'school-id',
        startTime: null,
        endTime: null,
        allDay: true,
        location: null,
        description: null,
      }),
    )
  })

  it('bloqueia evento com horário sobreposto na mesma data', async () => {
    vi.mocked(repo.findAllEventsRepository).mockResolvedValue([mockEvent])

    await expect(
      createEventService('school-id', {
        title: 'Nova atividade',
        category: 'atividade',
        date: '2025-07-15',
        startTime: '10:00',
        endTime: '11:00',
        allDay: false,
      }),
    ).rejects.toThrow('Event already exists at this time')

    expect(repo.createEventRepository).not.toHaveBeenCalled()
  })

  it('bloqueia evento de dia todo quando já há evento no dia', async () => {
    vi.mocked(repo.findAllEventsRepository).mockResolvedValue([mockEvent])

    await expect(
      createEventService('school-id', {
        title: 'Feriado',
        category: 'feriado',
        date: '2025-07-15',
        allDay: true,
      }),
    ).rejects.toThrow('Event already exists at this time')
  })
})

describe('updateEventService', () => {
  it('atualiza evento quando existe na escola', async () => {
    const updated = { ...mockEvent, title: 'Festival de Inverno 2025' }
    vi.mocked(repo.findEventByIdRepository).mockResolvedValue(mockEvent)
    vi.mocked(repo.updateEventRepository).mockResolvedValue(updated)

    const result = await updateEventService('school-id', 'event-id', { title: 'Festival de Inverno 2025' })

    expect(result.title).toBe('Festival de Inverno 2025')
    expect(repo.updateEventRepository).toHaveBeenCalledWith('school-id', 'event-id', {
      title: 'Festival de Inverno 2025',
    })
  })

  it('lança erro quando evento não existe na escola', async () => {
    vi.mocked(repo.findEventByIdRepository).mockResolvedValue(undefined as any)

    await expect(updateEventService('school-id', 'nao-existe', { title: 'X' })).rejects.toThrow(
      'Event not found',
    )
    expect(repo.updateEventRepository).not.toHaveBeenCalled()
  })

  it('bloqueia atualização que gera sobreposição', async () => {
    vi.mocked(repo.findEventByIdRepository).mockResolvedValue({
      ...mockEvent,
      id: 'event-atual',
      startTime: '07:00',
      endTime: '08:00',
    })
    vi.mocked(repo.findAllEventsRepository).mockResolvedValue([mockEvent])

    await expect(
      updateEventService('school-id', 'event-atual', {
        startTime: '10:00',
        endTime: '11:00',
      }),
    ).rejects.toThrow('Event already exists at this time')

    expect(repo.updateEventRepository).not.toHaveBeenCalled()
  })
})

describe('deleteEventService', () => {
  it('deleta evento quando existe na escola', async () => {
    vi.mocked(repo.findEventByIdRepository).mockResolvedValue(mockEvent)
    vi.mocked(repo.deleteEventRepository).mockResolvedValue(undefined as any)

    await expect(deleteEventService('school-id', 'event-id')).resolves.not.toThrow()
    expect(repo.deleteEventRepository).toHaveBeenCalledWith('school-id', 'event-id')
  })

  it('lança erro quando evento não existe na escola', async () => {
    vi.mocked(repo.findEventByIdRepository).mockResolvedValue(undefined as any)

    await expect(deleteEventService('school-id', 'nao-existe')).rejects.toThrow('Event not found')
    expect(repo.deleteEventRepository).not.toHaveBeenCalled()
  })
})
