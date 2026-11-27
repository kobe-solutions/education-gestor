import { describe, it, expect } from 'vitest'
import { applyMask, maskCEP, maskCNPJ, maskCPF, maskPhone, maskRG, onlyDigits } from '../../../lib/masks'

describe('masks', () => {
  it('onlyDigits remove caracteres não numéricos', () => {
    expect(onlyDigits('123.456.789-01')).toBe('12345678901')
    expect(onlyDigits('(11) 99999-8888')).toBe('11999998888')
  })

  it('maskCPF formata progressivamente e limita a 11 dígitos', () => {
    expect(maskCPF('')).toBe('')
    expect(maskCPF('123')).toBe('123')
    expect(maskCPF('1234')).toBe('123.4')
    expect(maskCPF('1234567')).toBe('123.456.7')
    expect(maskCPF('12345678901')).toBe('123.456.789-01')
    expect(maskCPF('12345678901999')).toBe('123.456.789-01')
  })

  it('maskCNPJ formata progressivamente e limita a 14 dígitos', () => {
    expect(maskCNPJ('12')).toBe('12')
    expect(maskCNPJ('12345')).toBe('12.345')
    expect(maskCNPJ('123456789012')).toBe('12.345.678/9012')
    expect(maskCNPJ('12345678000199')).toBe('12.345.678/0001-99')
  })

  it('maskCEP formata 00000-000 e limita a 8 dígitos', () => {
    expect(maskCEP('01310')).toBe('01310')
    expect(maskCEP('01310100')).toBe('01310-100')
    expect(maskCEP('0131010099')).toBe('01310-100')
  })

  it('maskPhone adapta entre fixo (10 dígitos) e celular (11 dígitos)', () => {
    expect(maskPhone('')).toBe('')
    expect(maskPhone('11')).toBe('(11')
    expect(maskPhone('113333')).toBe('(11) 3333')
    expect(maskPhone('1133334444')).toBe('(11) 3333-4444')
    expect(maskPhone('11999998888')).toBe('(11) 99999-8888')
    expect(maskPhone('11999998888999')).toBe('(11) 99999-8888')
  })

  it('maskRG formata 00.000.000-X aceitando dígito ou X no final', () => {
    expect(maskRG('12')).toBe('12')
    expect(maskRG('12345')).toBe('12.345')
    expect(maskRG('123456789')).toBe('12.345.678-9')
    expect(maskRG('12345678x')).toBe('12.345.678-X')
    expect(maskRG('12a3456789')).toBe('12.345.678-9')
  })

  it('applyMask delega para a máscara correta', () => {
    expect(applyMask('cpf', '11122233344')).toBe('111.222.333-44')
    expect(applyMask('cep', '12345678')).toBe('12345-678')
    expect(applyMask('phone', '11987654321')).toBe('(11) 98765-4321')
    expect(applyMask('rg', '12345678x')).toBe('12.345.678-X')
  })
})
