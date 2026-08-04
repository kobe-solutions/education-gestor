import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTeacherDashboardService } from '../../modules/teacherDashboard/teacherDashboard.service'
import * as repo from '../../modules/teacherDashboard/teacherDashboard.repository'

vi.mock('../../modules/teacherDashboard/teacherDashboard.repository')

const WEEK_DAY_MAP: Record<number, string> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}
const todayWeekDay = WEEK_DAY_MAP[new Date().getDay()] ?? ''
const otherWeekDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].find(
  (day) => day !== todayWeekDay,
) ?? 'monday'

function slot(
  classId: string,
  subjectId: string,
  weekDay = todayWeekDay,
  periodOrder = 1,
) {
  return {
    slotId: `slot-${classId}-${subjectId}`,
    weekDay,
    classPeriodId: 'period-1',
    classPeriodName: '1º Aula',
    startTime: '07:30',
    endTime: '08:20',
    periodOrder,
    classId,
    className: `Turma ${classId}`,
    subjectId,
    subjectName: 'Matemática',
  }
}

beforeEach(() => vi.clearAllMocks())

describe('getTeacherDashboardService', () => {
  it('enriquece as aulas de hoje com flags de chamada e notas', async () => {
    vi.mocked(repo.getTeacherClassesRepository).mockResolvedValue([
      { id: 'c1', name: 'Turma A', shift: 'manha', studentCount: 20, subjects: [] },
      { id: 'c2', name: 'Turma B', shift: 'manha', studentCount: 15, subjects: [] },
    ])
    vi.mocked(repo.getTeacherTimetableRepository).mockResolvedValue([
      slot('c1', 's1'),
      slot('c2', 's2'),
    ])
    vi.mocked(repo.getTeacherAttendanceSummaryRepository).mockResolvedValue([])
    vi.mocked(repo.getTeacherClassPerformanceRepository).mockResolvedValue([])
    vi.mocked(repo.findCurrentAcademicPeriodRepository).mockResolvedValue({ id: 'p1' })
    vi.mocked(repo.getTeacherAttendanceRegisteredClassIdsRepository).mockResolvedValue(
      new Set(['c1']),
    )
    vi.mocked(repo.getTeacherGradesRegisteredKeysRepository).mockResolvedValue(new Set(['c2:s2']))

    const result = await getTeacherDashboardService('school-1', 'teacher-1')

    const byClass = new Map(result.todaySchedule.map((s) => [s.class.id, s]))
    expect(byClass.get('c1')?.attendanceRegistered).toBe(true)
    expect(byClass.get('c1')?.gradesLaunched).toBe(false)
    expect(byClass.get('c2')?.attendanceRegistered).toBe(false)
    expect(byClass.get('c2')?.gradesLaunched).toBe(true)
    expect(result.pendingToday).toEqual({ attendance: 1, grades: 1 })
  })

  it('consulta notas sem filtro de período quando não existe período corrente', async () => {
    vi.mocked(repo.getTeacherClassesRepository).mockResolvedValue([])
    vi.mocked(repo.getTeacherTimetableRepository).mockResolvedValue([slot('c1', 's1')])
    vi.mocked(repo.getTeacherAttendanceSummaryRepository).mockResolvedValue([])
    vi.mocked(repo.getTeacherClassPerformanceRepository).mockResolvedValue([])
    vi.mocked(repo.findCurrentAcademicPeriodRepository).mockResolvedValue(undefined)
    vi.mocked(repo.getTeacherAttendanceRegisteredClassIdsRepository).mockResolvedValue(new Set())
    vi.mocked(repo.getTeacherGradesRegisteredKeysRepository).mockResolvedValue(new Set())

    await getTeacherDashboardService('school-1', 'teacher-1')

    expect(repo.getTeacherGradesRegisteredKeysRepository).toHaveBeenCalledWith(
      'school-1',
      'teacher-1',
      undefined,
    )
  })

  it('retorna grade do dia vazia e pendências zeradas fora do dia letivo', async () => {
    vi.mocked(repo.getTeacherClassesRepository).mockResolvedValue([])
    vi.mocked(repo.getTeacherTimetableRepository).mockResolvedValue([slot('c1', 's1', otherWeekDay)])
    vi.mocked(repo.getTeacherAttendanceSummaryRepository).mockResolvedValue([])
    vi.mocked(repo.getTeacherClassPerformanceRepository).mockResolvedValue([])
    vi.mocked(repo.findCurrentAcademicPeriodRepository).mockResolvedValue(undefined)
    vi.mocked(repo.getTeacherAttendanceRegisteredClassIdsRepository).mockResolvedValue(new Set())
    vi.mocked(repo.getTeacherGradesRegisteredKeysRepository).mockResolvedValue(new Set())

    const result = await getTeacherDashboardService('school-1', 'teacher-1')

    expect(result.todaySchedule).toHaveLength(0)
    expect(result.pendingToday).toEqual({ attendance: 0, grades: 0 })
  })
})