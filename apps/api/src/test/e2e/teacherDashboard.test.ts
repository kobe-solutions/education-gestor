import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import { buildTestApp, makeProfessorToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/teacherDashboard/teacherDashboard.repository', () => ({
  getTeacherClassesRepository: vi.fn(),
  getTeacherTimetableRepository: vi.fn(),
  getTeacherAttendanceSummaryRepository: vi.fn(),
  getTeacherClassPerformanceRepository: vi.fn(),
  findCurrentAcademicPeriodRepository: vi.fn(),
  getTeacherAttendanceRegisteredClassIdsRepository: vi.fn(),
  getTeacherGradesRegisteredKeysRepository: vi.fn(),
}))

import * as teacherDashboardRepo from '../../modules/teacherDashboard/teacherDashboard.repository'

const IDS = { school: '00000000-0000-0000-0000-000000000002' }

const WEEK_DAY_MAP: Record<number, string> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}
const todayWeekDay = WEEK_DAY_MAP[new Date().getDay()] ?? ''

let app: FastifyInstance
let professorToken: string

beforeAll(async () => {
  app = await buildTestApp()
  professorToken = makeProfessorToken(app, IDS.school)
})

beforeEach(() => vi.clearAllMocks())

afterAll(async () => {
  await app.close()
})

describe('GET /teacher/dashboard', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/teacher/dashboard' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna grade do dia com flags de pendências e resumo do dia', async () => {
    vi.mocked(teacherDashboardRepo.getTeacherClassesRepository).mockResolvedValue([])
    vi.mocked(teacherDashboardRepo.getTeacherTimetableRepository).mockResolvedValue([
      {
        slotId: 'slot-1',
        weekDay: todayWeekDay,
        classPeriodId: 'period-1',
        classPeriodName: '1º Aula',
        startTime: '07:30',
        endTime: '08:20',
        periodOrder: 1,
        classId: 'class-1',
        className: 'Turma A',
        subjectId: 'subject-1',
        subjectName: 'Matemática',
      },
    ])
    vi.mocked(teacherDashboardRepo.getTeacherAttendanceSummaryRepository).mockResolvedValue([])
    vi.mocked(teacherDashboardRepo.getTeacherClassPerformanceRepository).mockResolvedValue([])
    vi.mocked(teacherDashboardRepo.findCurrentAcademicPeriodRepository).mockResolvedValue({
      id: 'period-current',
    })
    vi.mocked(teacherDashboardRepo.getTeacherAttendanceRegisteredClassIdsRepository).mockResolvedValue(
      new Set(['class-1']),
    )
    vi.mocked(teacherDashboardRepo.getTeacherGradesRegisteredKeysRepository).mockResolvedValue(
      new Set(),
    )

    const res = await app.inject({
      method: 'GET',
      url: '/teacher/dashboard',
      headers: { authorization: `Bearer ${professorToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('todaySchedule')
    expect(body).toHaveProperty('pendingToday')
    expect(body.pendingToday).toEqual({ attendance: 0, grades: 1 })
    expect(teacherDashboardRepo.findCurrentAcademicPeriodRepository).toHaveBeenCalledWith(
      IDS.school,
      expect.any(String),
    )
  })
})