import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAdminActivity, type ActivityItem } from '../hooks/useAdminActivity'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip'
import { DataTable, type Column } from '../../../components/DataTable'

const PAGE_SIZE = 20

const ACTION_TO_API: Record<string, string> = {
  criou: 'CREATE',
  atualizou: 'UPDATE',
  excluiu: 'DELETE',
  pagou: 'PAY',
}

const ENTITY_TO_API: Record<string, string> = {
  aluno: 'student',
  professor: 'teacher',
  escola: 'school',
  secretaria: 'secretaria',
  turma: 'schoolClass',
  mensalidade: 'tuition',
  disciplina: 'subject',
  anoLetivo: 'academicYear',
  nota: 'grade',
  presenca: 'attendance',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criou',
  UPDATE: 'Atualizou',
  DELETE: 'Excluiu',
  PAY: 'Pagou',
}

const ENTITY_LABELS: Record<string, string> = {
  student: 'Aluno',
  teacher: 'Professor',
  school: 'Escola',
  secretaria: 'Secretaria',
  schoolClass: 'Turma',
  tuition: 'Mensalidade',
  subject: 'Disciplina',
  academicYear: 'Ano Letivo',
  grade: 'Nota',
  attendance: 'Presença',
}

const ACTION_VARIANTS: Record<string, string> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  PAY: 'warning',
}

function ActionBadge({ action }: { action: string }) {
  const variant = ACTION_VARIANTS[action] ?? 'outline'
  return <Badge variant={variant as any}>{ACTION_LABELS[action] ?? action}</Badge>
}

function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = {
    admin: 'Admin',
    gestor: 'Gestor',
    professor: 'Professor',
    secretaria: 'Secretaria',
  }
  return (
    <Badge variant="outline" className="text-[10px] font-medium">
      {labels[role] ?? role}
    </Badge>
  )
}

const columns: Column<ActivityItem>[] = [
  {
    key: 'createdAt',
    label: 'Data / Hora',
    render: (a) => {
      const d = new Date(a.createdAt)
      return (
        <span className="tabular-nums text-xs text-muted-foreground">
          {d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )
    },
  },
  {
    key: 'userId',
    label: 'Usuário',
    render: (a) => (
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <span className="font-mono text-xs font-medium cursor-default text-foreground">
              {a.userId.slice(0, 8)}…
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <span className="font-mono text-[11px]">{a.userId}</span>
          </TooltipContent>
        </Tooltip>
        <RoleBadge role={a.userRole} />
      </div>
    ),
  },
  {
    key: 'action',
    label: 'Ação',
    render: (a) => <ActionBadge action={a.action} />,
  },
  {
    key: 'entity',
    label: 'Entidade',
    render: (a) => (
      <span className="text-xs text-muted-foreground">
        {ENTITY_LABELS[a.entity] ?? a.entity}
      </span>
    ),
  },
]

export function AdminActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const actionFilter = searchParams.get('action') ?? ''
  const entityFilter = searchParams.get('entity') ?? ''

  const { data, isLoading } = useAdminActivity({
    action: actionFilter ? ACTION_TO_API[actionFilter] : undefined,
    entity: entityFilter ? ENTITY_TO_API[entityFilter] : undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, total)

  function getPageNumbers() {
    const pages: (number | '...')[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const updateFilter = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!value || value === 'todas') next.delete(key)
      else next.set(key, value)
      return next
    })
    setPage(1)
  }

  const hasFilters = actionFilter || entityFilter

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <PageHead
          title="Atividade da Plataforma"
          subtitle={`${total} registro${total !== 1 ? 's' : ''} de auditoria${hasFilters ? ' (filtrado)' : ''}`}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={actionFilter || 'todas'}
            onValueChange={(v) => updateFilter('action', v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="criou">Criou</SelectItem>
              <SelectItem value="atualizou">Atualizou</SelectItem>
              <SelectItem value="excluiu">Excluiu</SelectItem>
              <SelectItem value="pagou">Pagou</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={entityFilter || 'todas'}
            onValueChange={(v) => updateFilter('entity', v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="aluno">Aluno</SelectItem>
              <SelectItem value="professor">Professor</SelectItem>
              <SelectItem value="escola">Escola</SelectItem>
              <SelectItem value="secretaria">Secretaria</SelectItem>
              <SelectItem value="turma">Turma</SelectItem>
              <SelectItem value="mensalidade">Mensalidade</SelectItem>
              <SelectItem value="disciplina">Disciplina</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          rowKey={(a) => a.id}
          emptyMessage="Nenhum registro de atividade encontrado"
          emptyIcon={Activity}
          caption="Log de atividades"
          loading={isLoading}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-muted-foreground">
              Mostrando {startItem}–{endItem} de {total} registro{total !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                aria-label="Página anterior"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === page ? 'default' : 'outline'}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ),
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                aria-label="Próxima página"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
