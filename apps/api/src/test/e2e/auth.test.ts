import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/auth/auth.service', () => ({
  authenticateService: vi.fn(),
}))

import * as authService from '../../modules/auth/auth.service'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildTestApp()
})

afterAll(async () => {
  await app.close()
})

describe('POST /sessions', () => {
  it('retorna 200 e accessToken com credenciais válidas', async () => {
    vi.mocked(authService.authenticateService).mockResolvedValue({
      userId: 'gestor-id',
      schoolId: 'school-id',
      role: 'gestor',
    })

    const response = await app.inject({
      method: 'POST',
      url: '/sessions',
      body: { email: 'gestor@escola.com', password: 'senha123!' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveProperty('accessToken')
    expect(typeof response.json().accessToken).toBe('string')
  })

  it('retorna 401 com credenciais inválidas', async () => {
    vi.mocked(authService.authenticateService).mockRejectedValue(
      new Error('Invalid credentials'),
    )

    const response = await app.inject({
      method: 'POST',
      url: '/sessions',
      body: { email: 'nao@existe.com', password: 'errada123!' },
    })

    expect(response.statusCode).toBe(401)
  })

  it('retorna 400 com email inválido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/sessions',
      body: { email: 'nao-e-email', password: 'senha123!' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toHaveProperty('message', 'Validation error')
  })

  it('retorna 400 com senha curta demais', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/sessions',
      body: { email: 'gestor@escola.com', password: '123' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('retorna 400 sem body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/sessions',
    })

    expect(response.statusCode).toBe(400)
  })
})
