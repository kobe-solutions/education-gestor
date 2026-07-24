import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app'

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = buildApp()
  await app.ready()
  return app
}

export function makeAdminToken(app: FastifyInstance): string {
  return app.jwt.sign({ userId: 'admin-id', role: 'admin' })
}

export function makeSecretariaToken(app: FastifyInstance, secretariaId = 'secretaria-id'): string {
  return app.jwt.sign({ userId: secretariaId, secretariaId, role: 'secretaria' })
}

export function makeGestorToken(app: FastifyInstance, schoolId = 'school-id'): string {
  return app.jwt.sign({ userId: 'gestor-id', schoolId, role: 'gestor' })
}

export function makeProfessorToken(app: FastifyInstance, schoolId = 'school-id'): string {
  return app.jwt.sign({ userId: 'professor-id', schoolId, role: 'professor' })
}
