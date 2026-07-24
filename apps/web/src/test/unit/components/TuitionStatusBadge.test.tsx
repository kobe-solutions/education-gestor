import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TuitionStatusBadge } from '../../../features/financial/components/TuitionStatusBadge'

describe('TuitionStatusBadge', () => {
  it('exibe "Pendente" para status pending', () => {
    render(<TuitionStatusBadge status="pending" />)
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('exibe "Pago" para status paid', () => {
    render(<TuitionStatusBadge status="paid" />)
    expect(screen.getByText('Pago')).toBeInTheDocument()
  })

  it('exibe "Atrasado" para status overdue', () => {
    render(<TuitionStatusBadge status="overdue" />)
    expect(screen.getByText('Atrasado')).toBeInTheDocument()
  })
})
