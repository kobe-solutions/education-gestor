import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  registerGradeService,
  getStudentGradesService,
  registerAttendanceService,
  registerBulkAttendanceService,
  getStudentAttendancesService,
  getClassAttendanceByDateService,
} from '../../modules/academic/academic.service'
import * as repo from '../../modules/academic/academic.repository'
import * as studentRepo from '../../modules/students/students.repository'
import * as classRepo from '../../modules/classes/schoolClasses.repository'

vi.mock('../../modules/academic/academic.repository')
vi.mock('../../modules/students/students.repository')
vi.mock('../../modules/classes/schoolClasses.repository')

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
    vi.mocked(classRepo.findSchoolClassByIdRepository).mockResolvedValue(mockClass)
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.upsertGradeRepository).mockResolvedValue(mockGrade)

    const result = await registerGradeService({
      schoolId: 'school-id',
      classId: 'class-id',
      studentId: 'student-id',
      teacherId: 'teacher-id',
      subject: 'Matemática',
      value: 8.5,
      period: '1B',
    })

    expect(result).toEqual(mockGrade)
    expect(repo.upsertGradeRepository).toHaveBeenCalledWith(
      expect.objectContaining({ value: '8.5' }),
    )
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(classRepo.findSchoolClassByIdRepository).mockResolvedValue(undefined)
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)

    await expect(
      registerGradeService({
        schoolId: 'school-id',
        classId: 'nao-existe',
        studentId: 'student-id',
        teacherId: 'teacher-id',
        subject: 'Mat',
        value: 8,
        period: '1B',
      }),
    ).rejects.toThrow('Class not found')
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(classRepo.findSchoolClassByIdRepository).mockResolvedValue(mockClass)
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(undefined)

    await expect(
      registerGradeService({
        schoolId: 'school-id',
        classId: 'class-id',
        studentId: 'nao-existe',
        teacherId: 'teacher-id',
        subject: 'Mat',
        value: 8,
        period: '1B',
      }),
    ).rejects.toThrow('Student not found')
  })
})

describe('registerAttendanceService', () => {
  it('registra frequência quando turma e aluno existem', async () => {
    vi.mocked(classRepo.findSchoolClassByIdRepository).mockResolvedValue(mockClass)
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)
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
    vi.mocked(classRepo.findSchoolClassByIdRepository).mockResolvedValue(undefined)
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)

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
    vi.mocked(classRepo.findSchoolClassByIdRepository).mockResolvedValue(mockClass)
    vi.mocked(repo.upsertAttendanceRepository).mockResolvedValue(mockAttendance)

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
    expect(repo.upsertAttendanceRepository).toHaveBeenCalledTimes(2)
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(classRepo.findSchoolClassByIdRepository).mockResolvedValue(undefined)

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
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findGradesByStudentRepository).mockResolvedValue([mockGrade])

    const result = await getStudentGradesService('school-id', 'student-id')

    expect(result).toHaveLength(1)
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(undefined)

    await expect(getStudentGradesService('school-id', 'nao-existe')).rejects.toThrow('Student not found')
  })
})

describe('getStudentAttendancesService', () => {
  it('retorna frequências do aluno', async () => {
    vi.mocked(studentRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findAttendancesByStudentRepository).mockResolvedValue([mockAttendance])

    const result = await getStudentAttendancesService('school-id', 'student-id')

    expect(result).toHaveLength(1)
  })
})

describe('getClassAttendanceByDateService', () => {
  it('retorna frequências da turma na data', async () => {
    vi.mocked(classRepo.findSchoolClassByIdRepository).mockResolvedValue(mockClass)
    vi.mocked(repo.findAttendancesByClassAndDateRepository).mockResolvedValue([mockAttendance])

    const result = await getClassAttendanceByDateService('school-id', 'class-id', '2025-04-01')

    expect(result).toHaveLength(1)
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(classRepo.findSchoolClassByIdRepository).mockResolvedValue(undefined)

    await expect(
      getClassAttendanceByDateService('school-id', 'nao-existe', '2025-04-01'),
    ).rejects.toThrow('Class not found')
  })
})
