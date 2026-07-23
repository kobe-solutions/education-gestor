import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildTestApp, makeAdminToken, makeGestorToken, makeSecretariaToken } from '../helpers'
import type { FastifyInstance } from 'fastify'

vi.mock('../../modules/schools/schools.service', () => ({
  createSchoolService: vi.fn(),
  listSchoolsService: vi.fn(),
  getSchoolService: vi.fn(),
  updateSchoolService: vi.fn(),
  changeSchoolPasswordService: vi.fn(),
  deleteSchoolService: vi.fn(),
}))

import * as schoolsService from '../../modules/schools/schools.service'

const IDS = {
  school: '00000000-0000-0000-0000-000000000001',
  secretaria: '00000000-0000-0000-0000-000000000002',
  outraSecretaria: '00000000-0000-0000-0000-000000000003',
}

let app: FastifyInstance
let adminToken: string
let gestorToken: string
let secretariaToken: string
let outraSecretariaToken: string

const mockSchool = {
  id: IDS.school,
  name: 'Escola Teste',
  slug: 'escola-teste',
  email: 'gestor@escola.com',
  director: null,
  coordinator: null,
  phone: null,
  address: null,
  createdAt: new Date(),
}

const validBody = {
  name: 'Escola Teste',
  slug: 'escola-teste',
  email: 'gestor@escola.com',
  password: 'senha12345',
}

beforeAll(async () => {
  app = await buildTestApp()
  adminToken = makeAdminToken(app)
  gestorToken = makeGestorToken(app)
  secretariaToken = makeSecretariaToken(app, IDS.secretaria)
  outraSecretariaToken = makeSecretariaToken(app, IDS.outraSecretaria)
})

afterAll(async () => {
  await app.close()
})

describe('POST /schools', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'POST', url: '/schools', body: validBody })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 403 para gestor (apenas secretaria pode criar)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/schools',
      headers: { authorization: `Bearer ${gestorToken}` },
      body: validBody,
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 403 para admin (apenas secretaria pode criar)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/schools',
      headers: { authorization: `Bearer ${adminToken}` },
      body: validBody,
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 201 com token de secretaria', async () => {
    vi.mocked(schoolsService.createSchoolService).mockResolvedValue({ ...mockSchool, role: 'gestor' })

    const res = await app.inject({
      method: 'POST',
      url: '/schools',
      headers: { authorization: `Bearer ${secretariaToken}` },
      body: validBody,
    })

    expect(res.statusCode).toBe(201)
    expect(res.json()).toHaveProperty('id')
  })

  it('retorna 400 com slug inválido (body malformado)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/schools',
      headers: { authorization: `Bearer ${secretariaToken}` },
      body: { name: 'X', slug: 'a', email: 'nao-e-email', password: '123' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('retorna 409 quando escola já existe', async () => {
    vi.mocked(schoolsService.createSchoolService).mockRejectedValue(
      new Error('School already exists with this slug or email'),
    )

    const res = await app.inject({
      method: 'POST',
      url: '/schools',
      headers: { authorization: `Bearer ${secretariaToken}` },
      body: validBody,
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('GET /schools', () => {
  it('retorna 401 sem token', async () => {
    const res = await app.inject({ method: 'GET', url: '/schools' })
    expect(res.statusCode).toBe(401)
  })

  it('retorna 403 para gestor', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/schools',
      headers: { authorization: `Bearer ${gestorToken}` },
    })
    expect(res.statusCode).toBe(403)
  })

  it('retorna 200 para admin com todas as escolas', async () => {
    vi.mocked(schoolsService.listSchoolsService).mockResolvedValue([mockSchool] as any)

    const res = await app.inject({
      method: 'GET',
      url: '/schools',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveLength(1)
    expect(schoolsService.listSchoolsService).toHaveBeenCalledWith(undefined)
  })

  it('retorna 200 para secretaria com escolas filtradas', async () => {
    vi.mocked(schoolsService.listSchoolsService).mockResolvedValue([mockSchool] as any)

    const res = await app.inject({
      method: 'GET',
      url: '/schools',
      headers: { authorization: `Bearer ${secretariaToken}` },
    })

    expect(res.statusCode).toBe(200)
    expect(schoolsService.listSchoolsService).toHaveBeenCalledWith(IDS.secretaria)
  })
})

describe('GET /schools/:id', () => {
  it('retorna 200 para admin', async () => {
    vi.mocked(schoolsService.getSchoolService).mockResolvedValue(mockSchool as any)

    const res = await app.inject({
      method: 'GET',
      url: `/schools/${IDS.school}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
  })

  it('retorna 404 quando escola não existe', async () => {
    vi.mocked(schoolsService.getSchoolService).mockRejectedValue(new Error('School not found'))

    const res = await app.inject({
      method: 'GET',
      url: '/schools/nao-existe',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('PUT /schools/:id', () => {
  it('retorna 403 quando secretaria não é dona', async () => {
    vi.mocked(schoolsService.updateSchoolService).mockRejectedValue(new Error('Forbidden'))

    const res = await app.inject({
      method: 'PUT',
      url: `/schools/${IDS.school}`,
      headers: { authorization: `Bearer ${outraSecretariaToken}` },
      body: { name: 'Novo Nome' },
    })

    expect(res.statusCode).toBe(403)
  })

  it('retorna 200 quando secretaria é dona', async () => {
    vi.mocked(schoolsService.updateSchoolService).mockResolvedValue(mockSchool as any)

    const res = await app.inject({
      method: 'PUT',
      url: `/schools/${IDS.school}`,
      headers: { authorization: `Bearer ${secretariaToken}` },
      body: { name: 'Novo Nome' },
    })

    expect(res.statusCode).toBe(200)
  })

  it('retorna 200 quando admin edita qualquer escola', async () => {
    vi.mocked(schoolsService.updateSchoolService).mockResolvedValue(mockSchool as any)

    const res = await app.inject({
      method: 'PUT',
      url: `/schools/${IDS.school}`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { name: 'Novo Nome' },
    })

    expect(res.statusCode).toBe(200)
  })

  it('retorna 404 quando escola não existe', async () => {
    vi.mocked(schoolsService.updateSchoolService).mockRejectedValue(new Error('School not found'))

    const res = await app.inject({
      method: 'PUT',
      url: `/schools/nao-existe`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { name: 'Nome Válido' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('retorna 409 quando slug já pertence a outra escola', async () => {
    vi.mocked(schoolsService.updateSchoolService).mockRejectedValue(
      new Error('School already exists with this slug or email'),
    )

    const res = await app.inject({
      method: 'PUT',
      url: `/schools/${IDS.school}`,
      headers: { authorization: `Bearer ${adminToken}` },
      body: { slug: 'slug-existente' },
    })

    expect(res.statusCode).toBe(409)
  })
})

describe('PUT /schools/:id/password', () => {
  it('retorna 204 quando secretaria dona altera senha', async () => {
    vi.mocked(schoolsService.changeSchoolPasswordService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'PUT',
      url: `/schools/${IDS.school}/password`,
      headers: { authorization: `Bearer ${secretariaToken}` },
      body: { password: 'novasenha123' },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 403 quando secretaria não é dona', async () => {
    vi.mocked(schoolsService.changeSchoolPasswordService).mockRejectedValue(new Error('Forbidden'))

    const res = await app.inject({
      method: 'PUT',
      url: `/schools/${IDS.school}/password`,
      headers: { authorization: `Bearer ${outraSecretariaToken}` },
      body: { password: 'novasenha123' },
    })

    expect(res.statusCode).toBe(403)
  })

  it('retorna 400 com senha menor que 8 caracteres', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/schools/${IDS.school}/password`,
      headers: { authorization: `Bearer ${secretariaToken}` },
      body: { password: '123' },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('DELETE /schools/:id', () => {
  it('retorna 204 quando secretaria dona exclui', async () => {
    vi.mocked(schoolsService.deleteSchoolService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE',
      url: `/schools/${IDS.school}`,
      headers: { authorization: `Bearer ${secretariaToken}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 403 quando secretaria não é dona', async () => {
    vi.mocked(schoolsService.deleteSchoolService).mockRejectedValue(new Error('Forbidden'))

    const res = await app.inject({
      method: 'DELETE',
      url: `/schools/${IDS.school}`,
      headers: { authorization: `Bearer ${outraSecretariaToken}` },
    })

    expect(res.statusCode).toBe(403)
  })

  it('retorna 204 quando admin exclui qualquer escola', async () => {
    vi.mocked(schoolsService.deleteSchoolService).mockResolvedValue(undefined)

    const res = await app.inject({
      method: 'DELETE',
      url: `/schools/${IDS.school}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('retorna 404 quando escola não existe', async () => {
    vi.mocked(schoolsService.deleteSchoolService).mockRejectedValue(new Error('School not found'))

    const res = await app.inject({
      method: 'DELETE',
      url: '/schools/nao-existe',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
