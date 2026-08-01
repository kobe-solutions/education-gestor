import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import { createProviders } from '../../render'

describe('useSchoolKey', () => {
  it('admin: sempre habilitado com chave "admin"', () => {
    const { Providers } = createProviders({
      mockAuth: { payload: { userId: 'u1', name: 'Admin', role: 'admin' } },
    })
    const { result } = renderHook(() => useSchoolKey(), { wrapper: Providers })
    expect(result.current).toEqual({ schoolKey: 'admin', enabled: true })
  })

  it('gestor: usa schoolId do payload', () => {
    const { Providers } = createProviders({
      mockAuth: { payload: { userId: 'u1', name: 'Gestor', role: 'gestor', schoolId: 'school-2' } },
    })
    const { result } = renderHook(() => useSchoolKey(), { wrapper: Providers })
    expect(result.current).toEqual({ schoolKey: 'school-2', enabled: true })
  })

  it('professor: usa schoolId do payload', () => {
    const { Providers } = createProviders({
      mockAuth: { payload: { userId: 'u1', name: 'Prof', role: 'professor', schoolId: 'school-3' } },
    })
    const { result } = renderHook(() => useSchoolKey(), { wrapper: Providers })
    expect(result.current).toEqual({ schoolKey: 'school-3', enabled: true })
  })

  it('secretaria sem escola ativa: desabilitado', () => {
    const { Providers } = createProviders({
      mockAuth: { payload: { userId: 'u1', secretariaId: 'sec-1', name: 'Sec', role: 'secretaria' } },
      mockSchool: { activeSchoolId: null },
    })
    const { result } = renderHook(() => useSchoolKey(), { wrapper: Providers })
    expect(result.current).toEqual({ schoolKey: null, enabled: false })
  })

  it('secretaria com escola ativa: usa contexto', () => {
    const { Providers } = createProviders({
      mockAuth: { payload: { userId: 'u1', secretariaId: 'sec-1', name: 'Sec', role: 'secretaria' } },
      mockSchool: { activeSchoolId: 'school-7' },
    })
    const { result } = renderHook(() => useSchoolKey(), { wrapper: Providers })
    expect(result.current).toEqual({ schoolKey: 'school-7', enabled: true })
  })

  it('sem payload: desabilitado', () => {
    const { Providers } = createProviders({ mockAuth: { payload: null } })
    const { result } = renderHook(() => useSchoolKey(), { wrapper: Providers })
    expect(result.current).toEqual({ schoolKey: null, enabled: false })
  })
})
