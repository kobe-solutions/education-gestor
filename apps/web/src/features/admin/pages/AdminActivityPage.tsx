import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAdminActivity, type ActivityItem } from '../hooks/useAdminActivity'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { DataTable, type Column } from '../../../components/DataTable'

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

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    CREATE: { bg: 'hsl(var(--badge-success-bg))', fg: 'hsl(var(--badge-success-fg))' },
    UPDATE: { bg: 'hsl(var(--primary) / 0.1)', fg: 'hsl(var(--primary))' },
    DELETE: { bg: 'hsl(var(--badge-danger-bg))', fg: 'hsl(var(--badge-danger-fg))' },
    PAY: { bg: 'hsl(var(--badge-warning-bg))', fg: 'hsl(var(--badge-warning-fg))' },
  }
  const c = colors[action] ?? { bg: 'hsl(var(--border))', fg: 'hsl(var(--muted-foreground))' }
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {ACTION_LABELS[action] ?? action}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
    >
      {role}
    </span>
  )
}

const PAGE_SIZE = 20

export function AdminActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const actionFilter = searchParams.get('action') ?? ''
  const entityFilter = searchParams.get('entity') ?? ''

  const { data, isLoading } = useAdminActivity({
    action: actionFilter || undefined,
    entity: entityFilter || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  return (
    <div className="space-y-5">
      <PageHead
        title="Atividade da Plataforma"
        subtitle={`${data?.total ?? 0} registros de auditoria`}
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Ação
          </label>
          <select
            value={actionFilter}
            onChange={(e) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value) next.delete('action'); else next.set('action', e.target.value); return next }); setPage(0) }}
            className="h-9 rounded-sm border px-3 text-sm"
            style={{
              background: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
          >
            <option value="">Todas</option>
            <option value="CREATE">Criar</option>
            <option value="UPDATE">Atualizar</option>
            <option value="DELETE">Excluir</option>
            <option value="PAY">Pagar</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Entidade
          </label>
          <select
            value={entityFilter}
            onChange={(e) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value) next.delete('entity'); else next.set('entity', e.target.value); return next }); setPage(0) }}
            className="h-9 rounded-sm border px-3 text-sm"
            style={{
              background: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
          >
            <option value="">Todas</option>
            <option value="student">Aluno</option>
            <option value="teacher">Professor</option>
            <option value="school">Escola</option>
            <option value="secretaria">Secretaria</option>
            <option value="schoolClass">Turma</option>
            <option value="tuition">Mensalidade</option>
            <option value="subject">Disciplina</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'createdAt',
            label: 'Data / Hora',
            render: (a) => (
              <span className="tabular-nums text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {new Date(a.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ),
          },
          {
            key: 'userId',
            label: 'Usuário',
            render: (a) => (
              <>
                <span className="font-medium text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                  {a.userId.slice(0, 8)}…
                </span>
                <span className="ml-2">
                  <RoleBadge role={a.userRole} />
                </span>
              </>
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
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {ENTITY_LABELS[a.entity] ?? a.entity}
              </span>
            ),
          },
        ]}
        data={data?.items ?? []}
        rowKey={(a) => a.id}
        emptyMessage="Nenhum registro encontrado"
        emptyIcon={Activity}
        caption="Log de atividades"
        loading={isLoading}
      />
    </div>
  )
}
