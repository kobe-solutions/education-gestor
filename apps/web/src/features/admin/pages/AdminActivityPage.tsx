import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Activity } from 'lucide-react'
import { useAdminActivity, type ActivityItem } from '../hooks/useAdminActivity'
import { PageHead } from '../../../components/PageHead'
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
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total,
            onPageChange: setPage,
          }}
        />
      </div>
    </TooltipProvider>
  )
}
