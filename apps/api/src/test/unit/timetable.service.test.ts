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
  academicYear: '00000000-0000-0000-0000-000000000004',
  classPeriod: '00000000-0000-0000-0000-000000000005',
  subject: '00000000-0000-0000-0000-000000000006',
  teacher: '00000000-0000-0000-0000-000000000007',
  teacher2: '00000000-0000-0000-0000-000000000008',
}

const mockSlot = {
  id: IDS.slot,
  schoolId: IDS.school,
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

beforeEach(() => vi.clearAllMocks())

describe('createTimetableSlotService', () => {
  it('cria slot quando não há conflito de professor', async () => {
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createTimetableSlotRepository).mockResolvedValue(mockSlot)

    const result = await createTimetableSlotService(IDS.school, {
      classId: IDS.class,
      academicYearId: IDS.academicYear,
      classPeriodId: IDS.classPeriod,
      subjectId: IDS.subject,
      teacherId: IDS.teacher,
      weekDay: 'monday',
    })

    expect(result).toEqual(mockSlot)
    expect(repo.createTimetableSlotRepository).toHaveBeenCalled()
  })

  it('lança erro quando professor já tem slot no mesmo horário/dia/ano', async () => {
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue({ id: 'conflito-id' })

    await expect(
      createTimetableSlotService(IDS.school, {
        classId: IDS.class,
        academicYearId: IDS.academicYear,
        classPeriodId: IDS.classPeriod,
        subjectId: IDS.subject,
        teacherId: IDS.teacher,
        weekDay: 'monday',
      }),
    ).rejects.toThrow('Teacher already has a slot at this time')

    expect(repo.createTimetableSlotRepository).not.toHaveBeenCalled()
  })

  it('permite mesmo professor em dias diferentes', async () => {
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createTimetableSlotRepository).mockResolvedValue({ ...mockSlot, weekDay: 'tuesday' })

    await createTimetableSlotService(IDS.school, {
      classId: IDS.class,
      academicYearId: IDS.academicYear,
      classPeriodId: IDS.classPeriod,
      subjectId: IDS.subject,
      teacherId: IDS.teacher,
      weekDay: 'tuesday',
    })

    expect(repo.createTimetableSlotRepository).toHaveBeenCalled()
  })

  it('permite dois professores diferentes no mesmo slot de turmas diferentes', async () => {
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.createTimetableSlotRepository).mockResolvedValue({ ...mockSlot, teacherId: IDS.teacher2 })

    await createTimetableSlotService(IDS.school, {
      classId: IDS.class,
      academicYearId: IDS.academicYear,
      classPeriodId: IDS.classPeriod,
      subjectId: IDS.subject,
      teacherId: IDS.teacher2,
      weekDay: 'monday',
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
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(undefined as any)

    await expect(getTimetableSlotService(IDS.school, 'nao-existe')).rejects.toThrow(
      'Timetable slot not found',
    )
  })
})

describe('updateTimetableSlotService', () => {
  it('atualiza slot sem conflito de professor', async () => {
    const updated = { ...mockSlot, classPeriodId: 'new-period-id' }
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(mockSlot)
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.updateTimetableSlotRepository).mockResolvedValue(updated)

    const result = await updateTimetableSlotService(IDS.school, IDS.slot, { classPeriodId: 'new-period-id' })

    expect(result.classPeriodId).toBe('new-period-id')
  })

  it('lança erro ao atualizar horário com conflito', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(mockSlot)
    vi.mocked(repo.findConflictingSlotRepository).mockResolvedValue({ id: 'outro-slot' })

    await expect(
      updateTimetableSlotService(IDS.school, IDS.slot, { teacherId: IDS.teacher2 }),
    ).rejects.toThrow('Teacher already has a slot at this time')

    expect(repo.updateTimetableSlotRepository).not.toHaveBeenCalled()
  })

  it('não valida conflito ao atualizar subjectId', async () => {
    const updated = { ...mockSlot, subjectId: 'new-subject' }
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(mockSlot)
    vi.mocked(repo.updateTimetableSlotRepository).mockResolvedValue(updated)

    await updateTimetableSlotService(IDS.school, IDS.slot, { subjectId: 'new-subject' })

    expect(repo.findConflictingSlotRepository).not.toHaveBeenCalled()
  })

  it('lança erro quando slot não existe', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(undefined as any)

    await expect(
      updateTimetableSlotService(IDS.school, 'nao-existe', { subjectId: IDS.subject }),
    ).rejects.toThrow('Timetable slot not found')
  })
})

describe('deleteTimetableSlotService', () => {
  it('deleta quando existe', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(mockSlot)
    vi.mocked(repo.deleteTimetableSlotRepository).mockResolvedValue(undefined as any)

    await expect(deleteTimetableSlotService(IDS.school, IDS.slot)).resolves.not.toThrow()
    expect(repo.deleteTimetableSlotRepository).toHaveBeenCalledWith(IDS.school, IDS.slot)
  })

  it('lança erro quando não existe', async () => {
    vi.mocked(repo.findTimetableSlotByIdRepository).mockResolvedValue(undefined as any)

    await expect(deleteTimetableSlotService(IDS.school, 'nao-existe')).rejects.toThrow(
      'Timetable slot not found',
    )
  })
})
