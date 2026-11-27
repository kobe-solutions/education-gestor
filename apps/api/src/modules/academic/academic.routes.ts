import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import {
  registerGradeBodySchema,
  registerAttendanceBodySchema,
  bulkAttendanceBodySchema,
  bulkGradeBodySchema,
  createAssessmentBodySchema,
  updateAssessmentBodySchema,
  upsertPeriodGradeConfigBodySchema,
} from './academic.schema'
import {
  registerGradeService,
  registerBulkGradesService,
  getStudentGradesService,
  getClassGradesService,
  getClassAssessmentsService,
  createAssessmentService,
  updateAssessmentService,
  deleteAssessmentService,
  getClassPeriodGradeConfigsService,
  upsertPeriodGradeConfigService,
  registerAttendanceService,
  registerBulkAttendanceService,
  getStudentAttendancesService,
  getClassAttendanceByDateService,
  getStudentReportService,
} from './academic.service'
import { errorHandler, successHandler } from '../../lib/responseHandlers'

const preHandlerAll = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor', 'professor'])]

export async function academicRoutes(app: FastifyInstance) {
  app.post('/grades', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const body = registerGradeBodySchema.parse(request.body)
      const grade = await registerGradeService({ schoolId: getSchoolId(request), ...body })
      return successHandler(reply, 'Nota registrada com sucesso', 201, grade)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Class not found') {
          return errorHandler(reply, 'A turma informada não foi encontrada.', 404)
        }
        if (error.message === 'Student not found') {
          return errorHandler(reply, 'O aluno informado não foi encontrado.', 404)
        }
        if (error.name === 'ZodError') {
          return errorHandler(reply, 'Os dados da nota são inválidos. Confira os campos e tente novamente.', 400)
        }
      }
      return errorHandler(reply, 'Erro interno no servidor.', 500)
    }
  })

  app.post('/grades/bulk', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const body = bulkGradeBodySchema.parse(request.body)
      const result = await registerBulkGradesService({ schoolId: getSchoolId(request), ...body })
      return successHandler(reply, 'Notas registradas com sucesso', 201, result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Class not found') {
          return errorHandler(reply, 'A turma informada não foi encontrada.', 404)
        }
        if (error.message === 'Student not found') {
          return errorHandler(reply, 'O aluno informado não foi encontrado.', 404)
        }
        if (error.name === 'ZodError') {
          return errorHandler(reply, 'Os dados das notas são inválidos. Confira os campos e tente novamente.', 400)
        }
      }
      return errorHandler(reply, 'Erro interno no servidor.', 500)
    }
  })

  app.get('/students/:id/grades', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const grades = await getStudentGradesService(getSchoolId(request), id)
      return successHandler(reply, 'Notas do aluno carregadas com sucesso', 200, grades)
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return errorHandler(reply, 'O aluno informado não foi encontrado.', 404)
      }
      return errorHandler(reply, 'Erro interno no servidor.', 500)
    }
  })

  app.get('/school-classes/:id/grades', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const grades = await getClassGradesService(getSchoolId(request), id)
      return successHandler(reply, 'Notas da turma carregadas com sucesso', 200, grades)
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return errorHandler(reply, 'A turma informada não foi encontrada.', 404)
      }
      return errorHandler(reply, 'Erro interno no servidor.', 500)
    }
  })

  app.get('/school-classes/:id/assessments', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { subjectId, academicPeriodId } = request.query as {
        subjectId?: string
        academicPeriodId?: string
      }
      return reply.send(
        await getClassAssessmentsService(getSchoolId(request), id, subjectId, academicPeriodId),
      )
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/assessments', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const body = createAssessmentBodySchema.parse(request.body)
      const assessment = await createAssessmentService({ schoolId: getSchoolId(request), ...body })
      return reply.status(201).send(assessment)
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      if (error instanceof Error && error.message === 'Assessment weight must be positive') {
        return reply.status(400).send({ message: error.message })
      }
      throw error
    }
  })

  app.patch('/assessments/:id', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateAssessmentBodySchema.parse(request.body)
      const assessment = await updateAssessmentService(getSchoolId(request), id, body)
      return reply.send(assessment)
    } catch (error) {
      if (error instanceof Error && error.message === 'Assessment not found') {
        return reply.status(404).send({ message: error.message })
      }
      if (error instanceof Error && error.message === 'Assessment weight must be positive') {
        return reply.status(400).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/assessments/:id', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteAssessmentService(getSchoolId(request), id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Assessment not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.get('/school-classes/:id/grade-configs', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { subjectId } = request.query as { subjectId?: string }
      return reply.send(await getClassPeriodGradeConfigsService(getSchoolId(request), id, subjectId))
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/period-grade-configs', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const body = upsertPeriodGradeConfigBodySchema.parse(request.body)
      const config = await upsertPeriodGradeConfigService({ schoolId: getSchoolId(request), ...body })
      return reply.send(config)
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/attendances', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const body = registerAttendanceBodySchema.parse(request.body)
      const attendance = await registerAttendanceService({ schoolId: getSchoolId(request), ...body })
      return successHandler(reply, 'Frequência registrada com sucesso', 201, attendance)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Class not found') {
          return errorHandler(reply, 'A turma informada não foi encontrada.', 404)
        }
        if (error.message === 'Student not found') {
          return errorHandler(reply, 'O aluno informado não foi encontrado.', 404)
        }
        if (error.name === 'ZodError') {
          return errorHandler(reply, 'Os dados da frequência são inválidos. Confira os campos e tente novamente.', 400)
        }
      }
      return errorHandler(reply, 'Erro interno no servidor.', 500)
    }
  })

  app.post('/attendances/bulk', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const body = bulkAttendanceBodySchema.parse(request.body)
      const result = await registerBulkAttendanceService({ schoolId: getSchoolId(request), ...body })
      return successHandler(reply, 'Frequências registradas com sucesso', 201, result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Class not found') {
          return errorHandler(reply, 'A turma informada não foi encontrada.', 404)
        }
        if (error.message === 'Student not found') {
          return errorHandler(reply, 'O aluno informado não foi encontrado.', 404)
        }
        if (error.name === 'ZodError') {
          return errorHandler(reply, 'Os dados das frequências são inválidos. Confira os campos e tente novamente.', 400)
        }
      }
      return errorHandler(reply, 'Erro interno no servidor.', 500)
    }
  })

  app.get('/students/:id/attendances', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const attendances = await getStudentAttendancesService(getSchoolId(request), id)
      return successHandler(reply, 'Frequências do aluno carregadas com sucesso', 200, attendances)
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return errorHandler(reply, 'O aluno informado não foi encontrado.', 404)
      }
      return errorHandler(reply, 'Erro interno no servidor.', 500)
    }
  })

  app.get('/students/:id/report', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const report = await getStudentReportService(getSchoolId(request), id)
      return successHandler(reply, 'Relatório do aluno carregado com sucesso', 200, report)
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return errorHandler(reply, 'O aluno informado não foi encontrado.', 404)
      }
      return errorHandler(reply, 'Erro interno no servidor.', 500)
    }
  })

  app.get('/school-classes/:id/attendances', { preHandler: preHandlerAll }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { date } = request.query as { date?: string }

      if (!date) {
        return errorHandler(reply, 'A data é obrigatória e deve estar no formato AAAA-MM-DD.', 400)
      }

      const attendances = await getClassAttendanceByDateService(getSchoolId(request), id, date)
      return successHandler(reply, 'Frequências da turma carregadas com sucesso', 200, attendances)
    } catch (error) {
      if (error instanceof Error && error.message === 'Class not found') {
        return errorHandler(reply, 'A turma informada não foi encontrada.', 404)
      }
      return errorHandler(reply, 'Erro interno no servidor.', 500)
    }
  })
}
