import { describe, expect, it } from 'vitest'
import { canAccessRoute } from '../../../lib/routes'

describe('canAccessRoute', () => {
  it('protege rotas administrativas e financeiras por perfil', () => {
    expect(canAccessRoute('admin', '/admin')).toBe(true)
    expect(canAccessRoute('professor', '/admin')).toBe(false)
    expect(canAccessRoute('professor', '/financial')).toBe(false)
    expect(canAccessRoute('secretaria', '/financial-control')).toBe(true)
  })

  it('distingue a gestão de turmas da consulta a uma turma', () => {
    expect(canAccessRoute('gestor', '/classes')).toBe(true)
    expect(canAccessRoute('professor', '/classes')).toBe(false)
    expect(canAccessRoute('professor', '/classes/class-id')).toBe(true)
  })
})
