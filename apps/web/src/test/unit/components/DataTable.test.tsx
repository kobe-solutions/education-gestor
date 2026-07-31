import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable, type Column } from '../../../components/DataTable'

interface Item {
  id: string
  status: string
  name: string
}

const data: Item[] = [
  { id: '1', status: 'active', name: 'Maria' },
  { id: '2', status: 'inactive', name: 'João' },
]

describe('DataTable — filtro por coluna', () => {
  it('renderiza seletor de filtro no header quando a coluna é filterable', () => {
    const columns: Column<Item>[] = [
      { key: 'name', label: 'Nome' },
      {
        key: 'status',
        label: 'Situação',
        filter: {
          options: [
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' },
          ],
          value: null,
          onFilterChange: vi.fn(),
        },
      },
    ]

    render(<DataTable columns={columns} data={data} rowKey={(i) => i.id} />)

    const select = screen.getByLabelText('Filtrar por Situação')
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Todos' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Ativo' })).toBeInTheDocument()
  })

  it('chama onFilterChange ao trocar o valor e envia null para "Todos"', () => {
    const onFilterChange = vi.fn()
    const columns: Column<Item>[] = [
      { key: 'name', label: 'Nome' },
      {
        key: 'status',
        label: 'Situação',
        filter: {
          options: [
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' },
          ],
          value: null,
          onFilterChange,
        },
      },
    ]

    render(<DataTable columns={columns} data={data} rowKey={(i) => i.id} />)

    const select = screen.getByLabelText('Filtrar por Situação')
    fireEvent.change(select, { target: { value: 'active' } })
    expect(onFilterChange).toHaveBeenCalledWith('active')

    fireEvent.change(select, { target: { value: 'all' } })
    expect(onFilterChange).toHaveBeenCalledWith(null)
  })

  it('reflete o valor ativo do filtro', () => {
    const columns: Column<Item>[] = [
      { key: 'name', label: 'Nome' },
      {
        key: 'status',
        label: 'Situação',
        filter: {
          options: [{ value: 'active', label: 'Ativo' }],
          value: 'active',
          onFilterChange: vi.fn(),
        },
      },
    ]

    render(<DataTable columns={columns} data={data} rowKey={(i) => i.id} />)

    expect(screen.getByLabelText('Filtrar por Situação')).toHaveValue('active')
  })
})
