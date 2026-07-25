import { Inbox } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { TableSkeleton } from './skeletons'
import { EmptyState } from './EmptyState'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  className?: string
  headerClassName?: string
  render?: (row: T) => ReactNode
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
}: DataTableProps<T>) {
  const allColumns = actions
    ? [...columns, { key: '__actions', label: '', width: 80, align: 'right' as const }]
    : columns

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
        ) : data.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={emptyIcon ?? Inbox}
              title={emptyMessage}
            />
          </div>
        ) : (
          <Table aria-label={caption}>
            <TableHeader>
              <TableRow>
                {allColumns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={col.headerClassName}
                    style={{ width: col.width, textAlign: col.align }}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
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
    </Card>
  )
}
