import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listSchoolClassesService,
  getSchoolClassService,
  createSchoolClassService,
  updateSchoolClassService,
  deleteSchoolClassService,
  addStudentToClassService,
  removeStudentFromClassService,
} from '../../modules/classes/schoolClasses.service'
import * as repo from '../../modules/classes/schoolClasses.repository'
import * as timetableRepo from '../../modules/timetable/timetable.repository'
import * as studentsRepo from '../../modules/students/students.repository'

vi.mock('../../modules/classes/schoolClasses.repository')
vi.mock('../../modules/timetable/timetable.repository')
vi.mock('../../modules/students/students.repository')

const mockClass = {
  id: 'class-id',
  schoolId: 'school-id',
  serieId: null as string | null,
  academicYearId: null as string | null,
  name: '9A',
  shift: 'manhã',
  maxStudents: 40,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockStudent = {
  id: 'student-id',
  schoolId: 'school-id',
  name: 'João Silva',
  email: null as string | null,
  cpf: null as string | null,
  rg: null as string | null,
  birthDate: null as string | null,
  sex: null as string | null,
  bloodType: null as string | null,
  naturalidade: null as string | null,
  photoUrl: null as string | null,
  phone: null as string | null,
  motherName: null as string | null,
  fatherName: null as string | null,
  motherPhone: null as string | null,
  addressCep: null as string | null,
  addressStreet: null as string | null,
  addressNumber: null as string | null,
  addressComplement: null as string | null,
  addressNeighborhood: null as string | null,
  addressCity: null as string | null,
  addressState: null as string | null,
  comorbidities: null as string | null,
  observations: null as string | null,
  enrollmentCode: '20250001',
  internalCode: null as string | null,
  enrollmentStatus: 'active',
  enrollmentDate: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null as Date | null,
}

beforeEach(() => vi.clearAllMocks())

describe('listSchoolClassesService', () => {
  it('retorna lista vazia sem contar alunos', async () => {
    vi.mocked(repo.findAllSchoolClassesRepository).mockResolvedValue([])

    const result = await listSchoolClassesService('school-id')

    expect(result).toEqual([])
    expect(repo.countStudentsByClassesRepository).not.toHaveBeenCalled()
  })

  it('inclui contagem de alunos por turma', async () => {
    vi.mocked(repo.findAllSchoolClassesRepository).mockResolvedValue([mockClass] as any)
    vi.mocked(repo.countStudentsByClassesRepository).mockResolvedValue({ 'class-id': 25 })

    const result = await listSchoolClassesService('school-id')

    expect(result[0].studentCount).toBe(25)
    expect(repo.countStudentsByClassesRepository).toHaveBeenCalledWith(['class-id'])
  })

  it('usa 0 como contagem quando turma não tem alunos no mapa', async () => {
    vi.mocked(repo.findAllSchoolClassesRepository).mockResolvedValue([mockClass] as any)
    vi.mocked(repo.countStudentsByClassesRepository).mockResolvedValue({})

    const result = await listSchoolClassesService('school-id')

    expect(result[0].studentCount).toBe(0)
  })
})

describe('getSchoolClassService', () => {
  it('retorna turma com professores e alunos', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(mockClass as any)
    vi.mocked(timetableRepo.findDistinctTeachersByClassRepository).mockResolvedValue([])
    vi.mocked(repo.findStudentsByClassRepository).mockResolvedValue([mockStudent])

    const result = await getSchoolClassService('school-id', 'class-id') as any

    expect(result.id).toBe('class-id')
    expect(result.students).toHaveLength(1)
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(undefined as any)

    await expect(getSchoolClassService('school-id', 'nao-existe')).rejects.toThrow('Class not found')
  })
})

describe('createSchoolClassService', () => {
  it('cria turma com nome sem espaços extras', async () => {
    vi.mocked(repo.createSchoolClassRepository).mockResolvedValue(mockClass)

    await createSchoolClassService({ schoolId: 'school-id', name: '  9A  ', shift: 'manhã' })

    expect(repo.createSchoolClassRepository).toHaveBeenCalledWith(
      expect.objectContaining({ name: '9A', schoolId: 'school-id' }),
    )
  })

  it('usa null quando serieId não informado', async () => {
    vi.mocked(repo.createSchoolClassRepository).mockResolvedValue(mockClass)

    await createSchoolClassService({ schoolId: 'school-id', name: '9A', shift: 'manhã' })

    expect(repo.createSchoolClassRepository).toHaveBeenCalledWith(
      expect.objectContaining({ serieId: null }),
    )
  })
})

describe('updateSchoolClassService', () => {
  it('atualiza turma quando existe', async () => {
    const updated = { ...mockClass, name: '9B' }
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(mockClass as any)
    vi.mocked(repo.updateSchoolClassRepository).mockResolvedValue(updated)

    const result = await updateSchoolClassService('school-id', 'class-id', { name: '9B' })

    expect(result.name).toBe('9B')
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(undefined as any)

    await expect(
      updateSchoolClassService('school-id', 'nao-existe', { name: '9B' }),
    ).rejects.toThrow('Class not found')
  })
})

describe('deleteSchoolClassService', () => {
  it('deleta turma quando existe', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(mockClass as any)

    await expect(deleteSchoolClassService('school-id', 'class-id')).resolves.not.toThrow()
    expect(repo.deleteSchoolClassRepository).toHaveBeenCalledWith('school-id', 'class-id')
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(undefined as any)

    await expect(deleteSchoolClassService('school-id', 'nao-existe')).rejects.toThrow('Class not found')
  })
})

describe('addStudentToClassService', () => {
  it('matricula aluno na turma', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(mockClass as any)
    vi.mocked(studentsRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findClassStudentLinkRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.countStudentsByClassesRepository).mockResolvedValue({ 'class-id': 10 })
    vi.mocked(repo.addStudentToClassRepository).mockResolvedValue({ id: 'link-id', classId: 'class-id', studentId: 'student-id', createdAt: new Date() })

    await expect(addStudentToClassService('school-id', 'class-id', 'student-id')).resolves.not.toThrow()
  })

  it('lança erro se turma não existe', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(undefined as any)

    await expect(addStudentToClassService('school-id', 'nao-existe', 'student-id')).rejects.toThrow('Class not found')
  })

  it('lança erro se aluno não existe', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(mockClass as any)
    vi.mocked(studentsRepo.findStudentByIdRepository).mockResolvedValue(undefined as any)

    await expect(addStudentToClassService('school-id', 'class-id', 'nao-existe')).rejects.toThrow('Student not found')
  })

  it('lança erro se aluno já está na turma', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(mockClass as any)
    vi.mocked(studentsRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findClassStudentLinkRepository).mockResolvedValue({ id: 'link' })

    await expect(addStudentToClassService('school-id', 'class-id', 'student-id')).rejects.toThrow('Student already in class')
  })

  it('lança erro se turma está cheia', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(mockClass as any)
    vi.mocked(studentsRepo.findStudentByIdRepository).mockResolvedValue(mockStudent)
    vi.mocked(repo.findClassStudentLinkRepository).mockResolvedValue(undefined as any)
    vi.mocked(repo.countStudentsByClassesRepository).mockResolvedValue({ 'class-id': 40 })

    await expect(addStudentToClassService('school-id', 'class-id', 'student-id')).rejects.toThrow('Class is full')
  })
})

describe('removeStudentFromClassService', () => {
  it('remove aluno da turma', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(mockClass as any)
    vi.mocked(repo.findClassStudentLinkRepository).mockResolvedValue({ id: 'link-id' })

    await expect(removeStudentFromClassService('school-id', 'class-id', 'student-id')).resolves.not.toThrow()
    expect(repo.removeStudentFromClassRepository).toHaveBeenCalledWith('class-id', 'student-id')
  })

  it('lança erro se aluno não está na turma', async () => {
    vi.mocked(repo.findSchoolClassByIdRepository).mockResolvedValue(mockClass as any)
    vi.mocked(repo.findClassStudentLinkRepository).mockResolvedValue(undefined as any)

    await expect(removeStudentFromClassService('school-id', 'class-id', 'student-id')).rejects.toThrow('Student not in class')
  })
})
