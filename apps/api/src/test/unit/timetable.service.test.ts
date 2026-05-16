import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createTimetableSlotService,
  listTimetableSlotsService,
  getTimetableSlotService,
  updateTimetableSlotService,
  deleteTimetableSlotService,
} from '../../modules/timetable/timetable.service'
import * as repo from '../../modules/timetable/timetable.repository'

vi.mock('../../modules/timetable/timetable.repository')

const IDS = {
  slot: '00000000-0000-0000-0000-000000000001',
  school: '00000000-0000-0000-0000-000000000002',
  class: '00000000-0000-0000-0000-000000000003',
  period: '00000000-0000-0000-0000-000000000004',
  subject: '00000000-0000-0000-0000-000000000005',
  teacher: '00000000-0000-0000-0000-000000000006',
  teacher2: '00000000-0000-0000-0000-000000000007',
}

const mockSlot = {
  id: IDS.slot,
  schoolId: IDS.school,
  classId: IDS.class,
  academicPeriodId: IDS.period,
  subjectId: IDS.subject,
  teacherId: IDS.teacher,
  weekDay: 'monday',
  startTime: '07:30',
  endTime: '08:20',
  createdAt: new Date(),
  subject: { id: IDS.subject, name: 'Matemática' },
  teacher: { id: IDS.teacher, name: 'Prof. João' },
  academicPeriod: { id: IDS.period, name: '2025' },
}

beforeEach(() => vi.clearAllMocks())

describe('createTimetableSlotService', () => {
  it('cria slot quando não há conflito de professor', async () => {
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createTimetableSlotRepository).mockResolvedValue(mockSlot)

    const result = await createTimetableSlotService({
      schoolId: IDS.school,
      classId: IDS.class,
      academicPeriodId: IDS.period,
      subjectId: IDS.subject,
      teacherId: IDS.teacher,
      weekDay: 'monday',
      startTime: '07:30',
      endTime: '08:20',
    })

    expect(result).toEqual(mockSlot)
    expect(repo.createTimetableSlotRepository).toHaveBeenCalled()
  })

  it('lança 409 quando professor já tem slot no mesmo horário/dia/período', async () => {
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue({ id: 'conflito-id' })

    await expect(
      createTimetableSlotService({
        schoolId: IDS.school,
        classId: IDS.class,
        academicPeriodId: IDS.period,
        subjectId: IDS.subject,
        teacherId: IDS.teacher,
        weekDay: 'monday',
        startTime: '07:30',
        endTime: '08:20',
      }),
    ).rejects.toThrow('Teacher already has a slot at this time')

    expect(repo.createTimetableSlotRepository).not.toHaveBeenCalled()
  })

  it('permite mesmo professor em dias diferentes', async () => {
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createTimetableSlotRepository).mockResolvedValue({ ...mockSlot, weekDay: 'tuesday' })

    await createTimetableSlotService({
      schoolId: IDS.school,
      classId: IDS.class,
      academicPeriodId: IDS.period,
      subjectId: IDS.subject,
      teacherId: IDS.teacher,
      weekDay: 'tuesday',
      startTime: '07:30',
      endTime: '08:20',
    })

    expect(repo.createTimetableSlotRepository).toHaveBeenCalled()
  })

  it('permite dois professores diferentes no mesmo slot de turmas diferentes', async () => {
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue(undefined)
    vi.mocked(repo.createTimetableSlotRepository).mockResolvedValue({ ...mockSlot, teacherId: IDS.teacher2 })

    await createTimetableSlotService({
      schoolId: IDS.school,
      classId: IDS.class,
      academicPeriodId: IDS.period,
      subjectId: IDS.subject,
      teacherId: IDS.teacher2,
      weekDay: 'monday',
      startTime: '07:30',
      endTime: '08:20',
    })

    expect(repo.createTimetableSlotRepository).toHaveBeenCalled()
  })
})

describe('listTimetableSlotsService', () => {
  it('retorna slots da turma', async () => {
    vi.mocked(repo.listTimetableSlotsRepository).mockResolvedValue([mockSlot])

    const result = await listTimetableSlotsService(IDS.school, IDS.class)

    expect(result).toHaveLength(1)
    expect(repo.listTimetableSlotsRepository).toHaveBeenCalledWith(IDS.school, IDS.class)
  })
})

describe('getTimetableSlotService', () => {
  it('retorna slot quando existe', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(mockSlot)

    const result = await getTimetableSlotService(IDS.school, IDS.slot)

    expect(result).toEqual(mockSlot)
  })

  it('lança erro quando slot não existe', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(undefined)

    await expect(getTimetableSlotService(IDS.school, 'nao-existe')).rejects.toThrow(
      'Timetable slot not found',
    )
  })
})

describe('updateTimetableSlotService', () => {
  it('atualiza slot sem conflito de professor', async () => {
    const updated = { ...mockSlot, startTime: '08:30' }
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(mockSlot)
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue(undefined)
    vi.mocked(repo.updateTimetableSlotRepository).mockResolvedValue(updated)

    const result = await updateTimetableSlotService(IDS.school, IDS.slot, { startTime: '08:30' })

    expect(result.startTime).toBe('08:30')
  })

  it('lança 409 ao atualizar horário com conflito', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(mockSlot)
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue({ id: 'outro-slot' })

    await expect(
      updateTimetableSlotService(IDS.school, IDS.slot, { startTime: '09:00' }),
    ).rejects.toThrow('Teacher already has a slot at this time')

    expect(repo.updateTimetableSlotRepository).not.toHaveBeenCalled()
  })

  it('não valida conflito ao atualizar só o endTime', async () => {
    const updated = { ...mockSlot, endTime: '09:00' }
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(mockSlot)
    vi.mocked(repo.updateTimetableSlotRepository).mockResolvedValue(updated)

    await updateTimetableSlotService(IDS.school, IDS.slot, { endTime: '09:00' })

    expect(repo.findConflictingSlotRepository).not.toHaveBeenCalled()
  })

  it('lança erro quando slot não existe', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(undefined)

    await expect(
      updateTimetableSlotService(IDS.school, 'nao-existe', { subjectId: IDS.subject }),
    ).rejects.toThrow('Timetable slot not found')
  })
})

describe('deleteTimetableSlotService', () => {
  it('deleta quando existe', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(mockSlot)
    vi.mocked(repo.deleteTimetableSlotRepository).mockResolvedValue(undefined)

    await expect(deleteTimetableSlotService(IDS.school, IDS.slot)).resolves.not.toThrow()
    expect(repo.deleteTimetableSlotRepository).toHaveBeenCalledWith(IDS.school, IDS.slot)
  })

  it('lança erro quando não existe', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(undefined)

    await expect(deleteTimetableSlotService(IDS.school, 'nao-existe')).rejects.toThrow(
      'Timetable slot not found',
    )
  })
})
