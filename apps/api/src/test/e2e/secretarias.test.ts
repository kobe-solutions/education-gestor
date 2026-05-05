import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp, makeAdminToken, makeGestorToken, makeSecretariaToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/secretarias/secretarias.service', () => ({
  createSecretariaService: vi.fn(),
  addSchoolToSecretariaService: vi.fn(),
  removeSchoolFromSecretariaService: vi.fn(),
  listSchoolsBySecretariaService: vi.fn(),
}))

import * as secretariasService from '../../modules/secretarias/secretarias.service'

const IDS = {
  secretaria: '00000000-0000-0000-0000-000000000001',
  school: '00000000-0000-0000-0000-000000000002',
  outraSecretaria: '00000000-0000-0000-0000-000000000003',
}

let app: FastifyInstance
let adminToken: string
let gestorToken: string
let secretariaToken: string

const mockSecretaria = {
  id: IDS.secretaria,
  name: 'Rede ABC',
  email: 'rede@abc.com',
  role: 'secretaria',
  createdAt: new Date().toISOString(),
}

const mockLink = {
  id: 'link-id',
  secretariaId: IDS.secretaria,
  schoolId: IDS.school,
  createdAt: new Date().toISOString(),
}

const mockSchool = {
  id: IDS.school,
  name: 'Escola X',
  slug: 'escola-x',
  email: 'escola@x.com',
  createdAt: new Date().toISOString(),
}

beforeAll(async () => {
  app = await buildTestApp()
  adminToken = makeAdminToken(app)
  gestorToken = makeGestorToken(app)
  secretariaToken = makeSecretariaToken(app, IDS.secretaria)
})

afterAll(async () => {
  await app.close()
})

describe('POST /secretarias', () => {
  it('retorna 201 para admin', async () => {
    vi.mocked(secretariasService.createSecretariaService).mockResolvedValue(mockSecretaria as any)

    const response = await app.inject({
      method: 'POST',
      url: '/secretarias',
      headers: { authorization: `Bearer ${adminToken}` },
      body: { name: 'Rede ABC', email: 'rede@abc.com', password: 'senha123!' },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 403 para gestor', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/secretarias',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: { name: 'Rede', email: 'rede@abc.com', password: 'senha123!' },
    })

    expect(response.statusCode).toBe(403)
  })

  it('retorna 409 se email já existe', async () => {
    vi.mocked(secretariasService.createSecretariaService).mockRejectedValue(
      new Error('Secretaria already exists with this email'),
    )

    const response = await app.inject({
      method: 'POST',
      url: '/secretarias',
      headers: { authorization: `Bearer ${adminToken}` },
      body: { name: 'Duplicada', email: 'rede@abc.com', password: 'senha123!' },
    })

    expect(response.statusCode).toBe(409)
  })

  it('retorna 400 com body inválido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/secretarias',
      headers: { authorization: `Bearer ${adminToken}` },
      body: { name: 'X', email: 'nao-e-email', password: 'curta' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('retorna 401 sem token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/secretarias',
      body: { name: 'X', email: 'x@x.com', password: 'senha123!' },
    })
    expect(response.statusCode).toBe(401)
  })
})

describe('GET /secretarias/:id/schools', () => {
  it('retorna 200 para admin', async () => {
    vi.mocked(secretariasService.listSchoolsBySecretariaService).mockResolvedValue([mockSchool as any])

    const response = await app.inject({
      method: 'GET',
      url: `/secretarias/${IDS.secretaria}/schools`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toHaveLength(1)
  })

  it('retorna 200 para secretaria acessando seus próprios dados', async () => {
    vi.mocked(secretariasService.listSchoolsBySecretariaService).mockResolvedValue([mockSchool as any])

    const response = await app.inject({
      method: 'GET',
      url: `/secretarias/${IDS.secretaria}/schools`,
      headers: { authorization: `Bearer ${secretariaToken}` },
    })

    expect(response.statusCode).toBe(200)
  })

  it('retorna 403 para secretaria acessando outra secretaria', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/secretarias/${IDS.outraSecretaria}/schools`,
      headers: { authorization: `Bearer ${secretariaToken}` },
    })

    expect(response.statusCode).toBe(403)
  })
})

describe('POST /secretarias/:id/schools', () => {
  it('retorna 201 ao vincular escola', async () => {
    vi.mocked(secretariasService.addSchoolToSecretariaService).mockResolvedValue(mockLink as any)

    const response = await app.inject({
      method: 'POST',
      url: `/secretarias/${IDS.secretaria}/schools`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { schoolId: IDS.school },
    })

    expect(response.statusCode).toBe(201)
  })

  it('retorna 409 se escola já vinculada', async () => {
    vi.mocked(secretariasService.addSchoolToSecretariaService).mockRejectedValue(
      new Error('School already linked to this secretaria'),
    )

    const response = await app.inject({
      method: 'POST',
      url: `/secretarias/${IDS.secretaria}/schools`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { schoolId: IDS.school },
    })

    expect(response.statusCode).toBe(409)
  })
})

describe('DELETE /secretarias/:id/schools/:schoolId', () => {
  it('retorna 204 ao desvincular escola', async () => {
    vi.mocked(secretariasService.removeSchoolFromSecretariaService).mockResolvedValue(undefined)

    const response = await app.inject({
      method: 'DELETE',
      url: `/secretarias/${IDS.secretaria}/schools/${IDS.school}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(204)
  })

  it('retorna 404 se vínculo não existe', async () => {
    vi.mocked(secretariasService.removeSchoolFromSecretariaService).mockRejectedValue(
      new Error('School not linked to this secretaria'),
    )

    const response = await app.inject({
      method: 'DELETE',
      url: `/secretarias/${IDS.secretaria}/schools/${IDS.outraSecretaria}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(response.statusCode).toBe(404)
  })
})
