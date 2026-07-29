import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { getPageNumbers } from '../lib/getPageNumbers'

export interface DataTablePaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** Quando definido, renderiza o seletor "X por página" */
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const pageNumbers = getPageNumbers(page, totalPages)

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          Mostrando {start}–{end} de {total}
        </span>
        {pageSizeOptions && onPageSizeChange && (
          <select
            aria-label="Itens por página"
            className="h-8 px-2 text-xs rounded-md border outline-hidden"
            style={{ borderColor: 'hsl(var(--input))' }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}/página
              </option>
            ))}
          </select>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Paginação">
          <Button
            size="sm"
            variant="outline"
            disabled={!canPrev}
            aria-label="Página anterior"
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pageNumbers.map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                size="sm"
                variant={p === page ? 'default' : 'outline'}
                onClick={() => onPageChange(p)}
                aria-label={`Ir para página ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!canNext}
            aria-label="Próxima página"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  )
}
