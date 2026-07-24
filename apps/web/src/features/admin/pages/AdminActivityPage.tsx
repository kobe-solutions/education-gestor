import { useState } from 'react'
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAdminActivity, type ActivityItem } from '../hooks/useAdminActivity'
import { PageHead } from '../../../components/PageHead'
import { Skeleton } from '../../../components/ui/skeleton'
import { Button } from '../../../components/ui/button'

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
    CREATE: { bg: 'var(--iris-success-50)', fg: 'var(--iris-success-600)' },
    UPDATE: { bg: 'var(--iris-info-50)', fg: 'var(--iris-info-600)' },
    DELETE: { bg: 'var(--iris-danger-50)', fg: 'var(--iris-danger-600)' },
    PAY: { bg: 'var(--iris-warning-50)', fg: 'var(--iris-warning-600)' },
  }
  const c = colors[action] ?? { bg: 'var(--iris-slate-100)', fg: 'var(--fg-3)' }
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
      style={{ background: 'var(--iris-slate-100)', color: 'var(--fg-3)' }}
    >
      {role}
    </span>
  )
}

const PAGE_SIZE = 20

export function AdminActivityPage() {
  const [page, setPage] = useState(0)
  const [actionFilter, setActionFilter] = useState<string>('')
  const [entityFilter, setEntityFilter] = useState<string>('')

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
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-3)' }}>
            Ação
          </label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0) }}
            className="h-9 rounded-sm border px-3 text-sm"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--iris-slate-200)',
              color: 'var(--fg-1)',
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
          <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-3)' }}>
            Entidade
          </label>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(0) }}
            className="h-9 rounded-sm border px-3 text-sm"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--iris-slate-200)',
              color: 'var(--fg-1)',
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

      {/* Tabela */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--iris-slate-200)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 48, height: 48, background: 'var(--iris-slate-50)', color: 'var(--fg-3)' }}
            >
              <Activity size={22} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--fg-2)' }}>
              Nenhum registro encontrado
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--iris-slate-100)' }}>
                  {['Data / Hora', 'Usuário', 'Ação', 'Entidade'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--fg-3)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((a) => (
                  <tr
                    key={a.id}
                    className="transition-colors duration-150 hover:bg-[var(--iris-slate-50)]"
                    style={{ borderBottom: '1px solid var(--iris-slate-100)' }}
                  >
                    <td className="px-5 py-3 tabular-nums text-xs" style={{ color: 'var(--fg-3)' }}>
                      {new Date(a.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-xs" style={{ color: 'var(--fg-1)' }}>
                        {a.userId.slice(0, 8)}…
                      </span>
                      <span className="ml-2">
                        <RoleBadge role={a.userRole} />
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <ActionBadge action={a.action} />
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--fg-3)' }}>
                      {ENTITY_LABELS[a.entity] ?? a.entity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {data && data.total > PAGE_SIZE && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid var(--iris-slate-100)' }}
          >
            <span className="text-xs" style={{ color: 'var(--fg-3)' }}>
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
