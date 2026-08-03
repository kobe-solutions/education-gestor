import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  registerGradeService,
  registerBulkGradesService,
  getStudentGradesService,
  registerAttendanceService,
  registerBulkAttendanceService,
  getStudentAttendancesService,
  getClassAttendanceByDateService,
  getStudentReportService,
} from '../../modules/academic/academic.service'
import * as repo from '../../modules/academic/academic.repository'
import * as studentService from '../../modules/students/students.service'
import * as classService from '../../modules/classes/schoolClasses.service'
import * as classRepo from '../../modules/classes/schoolClasses.repository'
import * as timetableRepo from '../../modules/timetable/timetable.repository'

vi.mock('../../modules/academic/academic.repository')
vi.mock('../../modules/students/students.service')
vi.mock('../../modules/classes/schoolClasses.service')
vi.mock('../../modules/classes/schoolClasses.repository')
vi.mock('../../modules/timetable/timetable.repository')

const mockStudent = {
  id: 'student-id',
  schoolId: 'school-id',
  name: 'João',
  email: null,
  birthDate: null,
  enrollmentCode: 'MAT001',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockClass = {
  id: 'class-id',
  schoolId: 'school-id',
  name: '1A',
  grade: '1',
  shift: 'manhã',
  termTime: '2025',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockGrade = {
  id: 'grade-id',
  schoolId: 'school-id',
  classId: 'class-id',
  studentId: 'student-id',
  teacherId: 'teacher-id',
  subject: 'Matemática',
  value: '8.5',
  period: '1B',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockAttendance = {
  id: 'attendance-id',
  schoolId: 'school-id',
  classId: 'class-id',
  studentId: 'student-id',
  date: '2025-04-01',
  present: true,
  createdAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('registerGradeService', () => {
  it('registra nota quando turma e aluno existem', async () => {
    vi.mocked(classService.getSchoolClassService).mockResolvedValue(mockClass as any)
    vi.mocked(studentService.getStudentService).mockResolvedValue(mockStudent as any)
    vi.mocked(repo.upsertGradeRepository).mockResolvedValue(mockGrade as any)

    const result = await registerGradeService({
      schoolId: 'school-id',
      classId: 'class-id',
      studentId: 'student-id',
      teacherId: 'teacher-id',
      subjectId: 'subject-id',
      academicPeriodId: 'period-id',
      value: 8.5,
    })

    expect(result).toEqual(mockGrade)
    expect(repo.upsertGradeRepository).toHaveBeenCalledWith(
      expect.objectContaining({ value: 8.5 }),
    )
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(classService.getSchoolClassService).mockRejectedValue(new Error('Class not found'))
    vi.mocked(studentService.getStudentService).mockResolvedValue(mockStudent as any)

    await expect(
      registerGradeService({
        schoolId: 'school-id',
        classId: 'nao-existe',
        studentId: 'student-id',
        teacherId: 'teacher-id',
        subjectId: 'subject-id',
        academicPeriodId: 'period-id',
        value: 8,
      }),
    ).rejects.toThrow('Class not found')
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(classService.getSchoolClassService).mockResolvedValue(mockClass as any)
    vi.mocked(studentService.getStudentService).mockRejectedValue(new Error('Student not found'))

    await expect(
      registerGradeService({
        schoolId: 'school-id',
        classId: 'class-id',
        studentId: 'nao-existe',
        teacherId: 'teacher-id',
        subjectId: 'subject-id',
        academicPeriodId: 'period-id',
        value: 8,
      }),
    ).rejects.toThrow('Student not found')
  })
})

describe('registerBulkGradesService', () => {
  const bulkInput = {
    schoolId: 'school-id',
    classId: 'class-id',
    teacherId: 'teacher-id',
    subjectId: 'subject-id',
    grades: [
      { studentId: 'student-1', academicPeriodId: 'period-id', value: 8.5 },
      { studentId: 'student-2', academicPeriodId: 'period-id', value: 9.0 },
    ],
  }

  it('registra notas em lote para turma existente', async () => {
    vi.mocked(classService.getSchoolClassService).mockResolvedValue(mockClass as any)
    vi.mocked(repo.upsertBulkGradesRepository).mockResolvedValue([mockGrade as any, mockGrade as any])

    const result = await registerBulkGradesService(bulkInput)

    expect(result).toHaveLength(2)
    expect(repo.upsertBulkGradesRepository).toHaveBeenCalledTimes(1)
    expect(repo.upsertBulkGradesRepository).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ studentId: 'student-1', value: 8.5 }),
        expect.objectContaining({ studentId: 'student-2', value: 9.0 }),
      ]),
    )
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(classService.getSchoolClassService).mockRejectedValue(new Error('Class not found'))

    await expect(registerBulkGradesService(bulkInput)).rejects.toThrow('Class not found')
    expect(repo.upsertBulkGradesRepository).not.toHaveBeenCalled()
  })

  it('lança erro se alguma nota estiver fora do range', async () => {
    vi.mocked(classService.getSchoolClassService).mockResolvedValue(mockClass as any)

    await expect(
      registerBulkGradesService({
        ...bulkInput,
        grades: [{ studentId: 'student-1', academicPeriodId: 'period-id', value: 12 }],
      }),
    ).rejects.toThrow('Grade value must be between 0 and 10')
    expect(repo.upsertBulkGradesRepository).not.toHaveBeenCalled()
  })
})

describe('registerAttendanceService', () => {
  it('registra frequência quando turma e aluno existem', async () => {
    vi.mocked(classService.getSchoolClassService).mockResolvedValue(mockClass as any)
    vi.mocked(studentService.getStudentService).mockResolvedValue(mockStudent as any)
    vi.mocked(repo.upsertAttendanceRepository).mockResolvedValue(mockAttendance)

    const result = await registerAttendanceService({
      schoolId: 'school-id',
      classId: 'class-id',
      studentId: 'student-id',
      date: '2025-04-01',
      present: true,
    })

    expect(result).toEqual(mockAttendance)
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(classService.getSchoolClassService).mockRejectedValue(new Error('Class not found'))
    vi.mocked(studentService.getStudentService).mockResolvedValue(mockStudent as any)

    await expect(
      registerAttendanceService({
        schoolId: 'school-id',
        classId: 'nao-existe',
        studentId: 'student-id',
        date: '2025-04-01',
        present: true,
      }),
    ).rejects.toThrow('Class not found')
  })
})

describe('registerBulkAttendanceService', () => {
  it('registra frequência em lote para turma existente', async () => {
    vi.mocked(classService.getSchoolClassService).mockResolvedValue(mockClass as any)
    vi.mocked(repo.upsertBulkAttendanceRepository).mockResolvedValue([mockAttendance, mockAttendance])

    const result = await registerBulkAttendanceService({
      schoolId: 'school-id',
      classId: 'class-id',
      date: '2025-04-01',
      attendances: [
        { studentId: 'student-1', present: true },
        { studentId: 'student-2', present: false },
      ],
    })

    expect(result).toHaveLength(2)
    expect(repo.upsertBulkAttendanceRepository).toHaveBeenCalledTimes(1)
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(classService.getSchoolClassService).mockRejectedValue(new Error('Class not found'))

    await expect(
      registerBulkAttendanceService({
        schoolId: 'school-id',
        classId: 'nao-existe',
        date: '2025-04-01',
        attendances: [{ studentId: 'student-id', present: true }],
      }),
    ).rejects.toThrow('Class not found')
  })
})

describe('getStudentGradesService', () => {
  it('retorna notas do aluno', async () => {
    vi.mocked(studentService.getStudentService).mockResolvedValue(mockStudent as any)
    vi.mocked(repo.findGradesByStudentRepository).mockResolvedValue([mockGrade as any])

    const result = await getStudentGradesService('school-id', 'student-id')

    expect(result).toHaveLength(1)
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(studentService.getStudentService).mockRejectedValue(new Error('Student not found'))

    await expect(getStudentGradesService('school-id', 'nao-existe')).rejects.toThrow('Student not found')
  })
})

describe('getStudentAttendancesService', () => {
  it('retorna frequências do aluno', async () => {
    vi.mocked(studentService.getStudentService).mockResolvedValue(mockStudent as any)
    vi.mocked(repo.findAttendancesByStudentRepository).mockResolvedValue([mockAttendance])

    const result = await getStudentAttendancesService('school-id', 'student-id')

    expect(result).toHaveLength(1)
  })
})

describe('getClassAttendanceByDateService', () => {
  it('retorna frequências da turma na data', async () => {
    vi.mocked(classService.getSchoolClassService).mockResolvedValue(mockClass as any)
    vi.mocked(repo.findAttendancesByClassAndDateRepository).mockResolvedValue([mockAttendance])

    const result = await getClassAttendanceByDateService('school-id', 'class-id', '2025-04-01')

    expect(result).toHaveLength(1)
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(classService.getSchoolClassService).mockRejectedValue(new Error('Class not found'))

    await expect(
      getClassAttendanceByDateService('school-id', 'nao-existe', '2025-04-01'),
    ).rejects.toThrow('Class not found')
  })
})

describe('getStudentReportService', () => {
  const mathSubject = { id: 'math-id', name: 'Matemática' }
  const portSubject = { id: 'port-id', name: 'Português' }

  const baseReportData = {
    grades: [
      { classId: 'class-id', className: '1A', subjectId: 'math-id', subjectName: 'Matemática', academicPeriodId: 'p1-id', academicPeriodName: '1º Bimestre', academicPeriodOrder: 1, value: '8.0' },
      { classId: 'class-id', className: '1A', subjectId: 'math-id', subjectName: 'Matemática', academicPeriodId: 'p2-id', academicPeriodName: '2º Bimestre', academicPeriodOrder: 2, value: '6.0' },
      { classId: 'class-id', className: '1A', subjectId: 'port-id', subjectName: 'Português', academicPeriodId: 'p1-id', academicPeriodName: '1º Bimestre', academicPeriodOrder: 1, value: '4.0' },
      { classId: 'class-id', className: '1A', subjectId: 'port-id', subjectName: 'Português', academicPeriodId: 'p2-id', academicPeriodName: '2º Bimestre', academicPeriodOrder: 2, value: '3.0' },
    ],
    attendances: [
      { classId: 'class-id', present: true },
      { classId: 'class-id', present: true },
      { classId: 'class-id', present: true },
      { classId: 'class-id', present: true },
      { classId: 'class-id', present: false },
    ],
  }

  function mockReport(overrides: Partial<typeof baseReportData> = {}) {
    const data = { ...baseReportData, ...overrides }
    vi.mocked(studentService.getStudentService).mockResolvedValue(mockStudent as any)
    vi.mocked(repo.findStudentReportDataRepository).mockResolvedValue(data as any)
    vi.mocked(classRepo.findStudentCurrentClassRepository).mockResolvedValue(undefined as any)
    vi.mocked(timetableRepo.findSubjectsByClassRepository).mockResolvedValue([])
  }

  it('agrega notas por disciplina, calcula médias e situação', async () => {
    mockReport()

    const report = await getStudentReportService('school-id', 'student-id')

    expect(report.studentId).toBe('student-id')
    expect(report.studentName).toBe('João')
    expect(report.periods).toEqual([
      { id: 'p1-id', name: '1º Bimestre', order: 1 },
      { id: 'p2-id', name: '2º Bimestre', order: 2 },
    ])
    expect(report.subjects).toHaveLength(2)

    const math = report.subjects.find((s) => s.subjectName === 'Matemática')
    expect(math?.average).toBe(7)
    expect(math?.status).toBe('approved')
    expect(math?.grades).toHaveLength(2)

    const port = report.subjects.find((s) => s.subjectName === 'Português')
    expect(port?.average).toBe(3.5)
    expect(port?.status).toBe('recovery')

    expect(report.overall.average).toBe(5.25)
    expect(report.overall.status).toBe('recovery')
    expect(report.overall.approvedSubjects).toBe(1)
    expect(report.overall.totalSubjects).toBe(2)
    expect(report.overall.attendance).toEqual({ rate: 80, presentCount: 4, totalCount: 5 })
  })

  it('marca disciplina como reprovada quando média é inferior ao mínimo de recuperação', async () => {
    mockReport({
      grades: baseReportData.grades.map((g) =>
        g.subjectId === 'port-id' ? { ...g, value: '2.0' } : g,
      ),
    })

    const report = await getStudentReportService('school-id', 'student-id')

    const port = report.subjects.find((s) => s.subjectName === 'Português')
    expect(port?.average).toBe(2)
    expect(port?.status).toBe('failed')
    expect(report.overall.status).toBe('failed')
  })

  it('considera frequência abaixo do mínimo como reprovação na situação geral', async () => {
    mockReport({
      attendances: [
        { classId: 'class-id', present: true },
        { classId: 'class-id', present: false },
        { classId: 'class-id', present: false },
      ],
    })

    const report = await getStudentReportService('school-id', 'student-id')

    expect(report.overall.attendance?.rate).toBe(33)
    expect(report.overall.status).toBe('failed')
  })

  it('inclui disciplinas da grade horária mesmo sem notas lançadas', async () => {
    mockReport()
    vi.mocked(classRepo.findStudentCurrentClassRepository).mockResolvedValue({
      classId: 'class-id',
      className: '1A',
    } as any)
    vi.mocked(timetableRepo.findSubjectsByClassRepository).mockResolvedValue([
      mathSubject,
      portSubject,
      { id: 'geo-id', name: 'Geografia' },
    ])

    const report = await getStudentReportService('school-id', 'student-id')

    expect(report.subjects).toHaveLength(3)
    const geo = report.subjects.find((s) => s.subjectName === 'Geografia')
    expect(geo?.grades).toEqual([])
    expect(geo?.average).toBeNull()
    expect(geo?.status).toBeNull()
    expect(report.overall.totalSubjects).toBe(3)
  })

  it('retorna relatório vazio quando não há notas nem disciplinas na grade', async () => {
    mockReport({ grades: [], attendances: [] })

    const report = await getStudentReportService('school-id', 'student-id')

    expect(report.subjects).toEqual([])
    expect(report.overall.average).toBeNull()
    expect(report.overall.status).toBeNull()
    expect(report.overall.attendance).toEqual({ rate: null, presentCount: 0, totalCount: 0 })
  })

  it('aplica média de aprovação de 6,0 na situação das disciplinas', async () => {
    mockReport({
      grades: [
        { classId: 'class-id', className: '1A', subjectId: 'math-id', subjectName: 'Matemática', academicPeriodId: 'p1-id', academicPeriodName: '1º Bimestre', academicPeriodOrder: 1, value: '5.0' },
        { classId: 'class-id', className: '1A', subjectId: 'math-id', subjectName: 'Matemática', academicPeriodId: 'p2-id', academicPeriodName: '2º Bimestre', academicPeriodOrder: 2, value: '6.0' },
        { classId: 'class-id', className: '1A', subjectId: 'port-id', subjectName: 'Português', academicPeriodId: 'p1-id', academicPeriodName: '1º Bimestre', academicPeriodOrder: 1, value: '6.0' },
        { classId: 'class-id', className: '1A', subjectId: 'port-id', subjectName: 'Português', academicPeriodId: 'p2-id', academicPeriodName: '2º Bimestre', academicPeriodOrder: 2, value: '6.0' },
      ],
    })

    const report = await getStudentReportService('school-id', 'student-id')

    const math = report.subjects.find((s) => s.subjectName === 'Matemática')
    expect(math?.average).toBe(5.5)
    expect(math?.status).toBe('recovery')

    const port = report.subjects.find((s) => s.subjectName === 'Português')
    expect(port?.average).toBe(6)
    expect(port?.status).toBe('approved')

    expect(report.overall.status).toBe('recovery')
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(studentService.getStudentService).mockRejectedValue(new Error('Student not found'))

    await expect(getStudentReportService('school-id', 'nao-existe')).rejects.toThrow(
      'Student not found',
    )
    expect(repo.findStudentReportDataRepository).not.toHaveBeenCalled()
  })
})
