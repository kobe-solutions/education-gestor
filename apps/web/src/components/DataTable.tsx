import { Inbox, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { TableSkeleton } from './skeletons'
import { EmptyState } from './EmptyState'
import { DataTablePagination, type DataTablePaginationProps } from './DataTablePagination'
import { cn } from '../lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface ColumnFilter {
  /** Opções exibidas no seletor do header. `null` = sem filtro (Todos) */
  options: { value: string; label: string }[]
  /** Valor ativo do filtro. `null` = todos */
  value: string | null
  /** Notifica o pai para atualizar o filtro. Se definido, renderiza o seletor no header. */
  onFilterChange?: (value: string | null) => void
  /** Label da opção "sem filtro". Default: 'Todos' */
  placeholder?: string
}

export interface Column<T> {
  key: string
  label: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  className?: string
  headerClassName?: string
  render?: (row: T) => ReactNode
  /** Habilita ordenação por esta coluna. Default: false */
  sortable?: boolean
  /** Chave usada na ordenação. Se não definida, usa `key` */
  sortKey?: string
  /** Filtro por coluna renderizado no header. Default: sem filtro */
  filter?: ColumnFilter
}

export interface SortState {
  column: string | null
  direction: 'asc' | 'desc' | null
}

export interface DataTableSortProps<T> {
  /** Coluna atualmente ordenada (key) */
  column: string | null
  /** Direção atual */
  direction: 'asc' | 'desc' | null
  /** Notifica o pai para atualizar a ordenação. Se definido, click no header ativa. */
  onSortChange?: (column: string, direction: 'asc' | 'desc' | null) => void
  /** Extractor de valor da célula para uma coluna (usado para client-side sort) */
  getSortValue?: (row: T, columnKey: string) => unknown
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  actions?: (row: T) => ReactNode
  emptyMessage?: string
  emptyIcon?: LucideIcon
  loading?: boolean
  loadingSkeleton?: ReactNode
  caption?: string
  title?: string
  count?: number
  /** Paginação server-side (ou client-side com pageSize fixo) */
  pagination?: Omit<DataTablePaginationProps, 'itemName'>
  /** Estado de ordenação */
  sort?: DataTableSortProps<T>
}

function sortData<T>(
  data: T[],
  column: string | null,
  direction: 'asc' | 'desc' | null,
  columns: Column<T>[],
  getSortValue?: (row: T, columnKey: string) => unknown,
): T[] {
  if (!column || !direction) return data

  const col = columns.find((c) => c.key === column || c.sortKey === column)
  const sortKey = col?.sortKey ?? col?.key ?? column

  const valueOf = (row: T): unknown => {
    if (getSortValue) return getSortValue(row, sortKey)
    return (row as unknown as Record<string, unknown>)[sortKey]
  }

  const sorted = [...data].sort((a, b) => {
    const av = valueOf(a)
    const bv = valueOf(b)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return av - bv
    return String(av).localeCompare(String(bv), 'pt-BR', { sensitivity: 'base' })
  })

  return direction === 'asc' ? sorted : sorted.reverse()
}

function nextDirection(current: 'asc' | 'desc' | null, column: string, activeColumn: string | null): 'asc' | 'desc' | null {
  if (column !== activeColumn) return 'asc'
  if (current === 'asc') return 'desc'
  if (current === 'desc') return null
  return 'asc'
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  actions,
  emptyMessage = 'Nenhum registro encontrado',
  emptyIcon,
  loading,
  loadingSkeleton,
  caption,
  title,
  count,
  pagination,
  sort,
}: DataTableProps<T>) {
  const allColumns = actions
    ? [...columns, { key: '__actions', label: '', width: 80, align: 'right' as const }]
    : columns

  const sortedData = sort
    ? sortData(data, sort.column, sort.direction, allColumns, sort.getSortValue)
    : data

  const showPagination = pagination && pagination.total > pagination.pageSize

  return (
    <Card>
      {(title || count !== undefined) && (
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title ?? `${count} registro${count !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {loading ? (
          loadingSkeleton ?? (
            <div className="p-4">
              <TableSkeleton columns={allColumns.length} rows={5} />
            </div>
          )
        ) : sortedData.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={emptyIcon ?? Inbox} title={emptyMessage} />
          </div>
        ) : (
          <Table aria-label={caption}>
            <TableHeader>
              <TableRow>
                {allColumns.map((col) => {
                  const isActive = sort?.column === col.key
                  const dir = isActive ? sort.direction : null
                  const ariaSort: 'ascending' | 'descending' | 'none' =
                    dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'
                  const canFilter = col.filter?.onFilterChange != null
                  const canSort = col.sortable && sort?.onSortChange != null

                  let labelNode: ReactNode
                  if (canSort) {
                    const handleClick = () => {
                      const next = nextDirection(sort.direction, col.key, sort.column)
                      sort.onSortChange?.(col.key, next)
                    }
                    const SortIcon = !isActive ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
                    labelNode = (
                      <button
                        type="button"
                        onClick={handleClick}
                        className="inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm -mx-1 px-1"
                      >
                        {col.label}
                        <SortIcon className="h-3 w-3 opacity-60" aria-hidden="true" />
                      </button>
                    )
                  } else {
                    labelNode = col.label
                  }

                  return (
                    <TableHead
                      key={col.key}
                      className={col.headerClassName}
                      style={{ width: col.width, textAlign: col.align }}
                      aria-sort={canSort ? ariaSort : undefined}
                    >
                      <div className={cn('flex flex-col', canFilter ? 'items-start gap-1' : undefined)}>
                        {labelNode}
                        {canFilter && col.filter && (
                          <select
                            aria-label={`Filtrar por ${col.label}`}
                            value={col.filter.value ?? 'all'}
                            onChange={(e) => {
                              const v = e.target.value
                              col.filter?.onFilterChange?.(v && v !== 'all' ? v : null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 w-full max-w-[120px] px-1 text-[11px] rounded border outline-hidden cursor-pointer"
                            style={{
                              borderColor: 'hsl(var(--input))',
                              background: 'hsl(var(--card))',
                              color: 'hsl(var(--foreground))',
                            }}
                          >
                            <option value="all">{col.filter.placeholder ?? 'Todos'}</option>
                            {col.filter.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {allColumns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={col.key === '__actions' ? 'onClick-stop' : col.className}
                      style={{ textAlign: col.align }}
                      onClick={col.key === '__actions' ? (e) => e.stopPropagation() : undefined}
                    >
                      {col.key === '__actions'
                        ? actions?.(row)
                        : col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {showPagination && pagination && (
        <div className="px-4 pb-4 pt-2 border-t">
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
          />
        </div>
      )}
    </Card>
  )
}
