import { useState } from 'react'
import { Link } from 'react-router'
import { AlertCircle, AlertTriangle, FileText, Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SectionHeader } from './SectionHeader'
import { TONE_CONFIG, type ToneKey } from '../../../lib/colors'
import { api } from '../../../lib/api'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import type { Alerts } from '../hooks/useDashboard'

interface DemandSectionProps {
  alerts: Alerts
  blocked: boolean
}

const ALERT_PAGE_SIZE = 10

interface Demand {
  id: string
  type: string
  title: string
  description: string | null
  responsible: string | null
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  resolved: 'Resolvida',
  cancelled: 'Cancelada',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: '#fef3c7', text: '#92400e' },
  in_progress: { bg: '#dbeafe', text: '#1e40af' },
  resolved: { bg: '#d1fae5', text: '#065f46' },
  cancelled: { bg: '#f3f4f6', text: '#374151' },
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: '#f3f4f6', text: '#374151' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  high: { bg: '#fee2e2', text: '#991b1b' },
}

export function DemandSection({ alerts, blocked }: DemandSectionProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  function toggle(key: string) {
    setExpanded((prev) => (prev === key ? null : key))
  }

  const demandCards = [
    {
      key: 'overdue-tuitions',
      label: 'Mensalidades atrasadas',
      count: alerts.overdueTuitions,
      icon: AlertCircle,
      tone: 'red' as ToneKey,
      navigateTo: '/financial?status=overdue',
      visible: !blocked,
    },
    {
      key: 'no-guardian',
      label: 'Sem responsável',
      count: alerts.studentsWithoutGuardians.length,
      icon: AlertTriangle,
      tone: 'amber' as ToneKey,
      visible: true,
    },
    {
      key: 'no-doc',
      label: 'Sem doc. identidade',
      count: alerts.studentsWithoutIdDocument.length,
      icon: FileText,
      tone: 'amber' as ToneKey,
      visible: true,
    },
    {
      key: 'low-attendance',
      label: 'Com 3+ faltas (30d)',
      count: alerts.lowAttendanceStudents.length,
      icon: Users,
      tone: 'amber' as ToneKey,
      visible: true,
    },
  ].filter((c) => c.visible)

  return (
    <section className="space-y-4">
      <SectionHeader title="Controle de Demandas" subtitle="Ações pendentes que precisam de atenção" />
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${demandCards.length === 4 ? 'lg:grid-cols-4' : ''}`}>
        {demandCards.map((card) => {
          const t = TONE_CONFIG[card.tone]
          const isExpanded = expanded === card.key
          const hasExpandableDetails = !card.navigateTo && card.count > 0

          return (
            <div key={card.key}>
              <button
                type="button"
                onClick={() => {
                  if (card.navigateTo) {
                    window.location.href = card.navigateTo
                  } else if (hasExpandableDetails) {
                    toggle(card.key)
                  }
                }}
                className="w-full rounded-xl p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md) text-left"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: card.navigateTo || hasExpandableDetails ? 'pointer' : 'default',
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center justify-center rounded-md shrink-0"
                    style={{ width: 32, height: 32, background: t.iconBg, color: t.iconColor }}
                  >
                    <card.icon size={16} strokeWidth={2.2} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold tabular-nums" style={{ color: t.valueColor }}>
                      {card.count}
                    </span>
                    {hasExpandableDetails && (
                      isExpanded
                        ? <ChevronUp size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                        : <ChevronDown size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {card.label}
                </span>
              </button>

              {isExpanded && !card.navigateTo && (
                <DemandDetailTable
                  type={card.key}
                  alerts={alerts}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* CRUD Demands */}
      <DemandCrudSection showForm={showForm} setShowForm={setShowForm} />
    </section>
  )
}

function DemandCrudSection({ showForm, setShowForm }: { showForm: boolean; setShowForm: (v: boolean) => void }) {
  const { schoolKey } = useSchoolKey()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['demands', schoolKey],
    queryFn: async () => {
      const res = await api.get<{ demands: Demand[]; total: number }>('/demands')
      return res.data
    },
    enabled: !!schoolKey,
  })

  const createMutation = useMutation({
    mutationFn: async (body: { type: string; title: string; description?: string; responsible?: string; priority?: string; dueDate?: string }) => {
      return api.post('/demands', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands', schoolKey] })
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/demands/${id}`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands', schoolKey] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/demands/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands', schoolKey] })
    },
  })

  const demands = data?.demands ?? []

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Demandas Personalizadas</span>
          <span
            className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: '#dbeafe', color: '#1e40af' }}
          >
            {demands.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors hover:opacity-80"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          <Plus size={14} />
          Nova Demanda
        </button>
      </div>

      {showForm && (
        <DemandForm
          onSubmit={(body) => createMutation.mutate(body)}
          onCancel={() => setShowForm(false)}
          isLoading={createMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </div>
      ) : demands.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Nenhuma demanda criada. Clique em "Nova Demanda" para criar.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Tipo', 'Título', 'Responsável', 'Prioridade', 'Status', 'Prazo', 'Ações'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demands.map((d) => (
                <tr
                  key={d.id}
                  className="transition-colors duration-150 hover:bg-accent"
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{d.type}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-xs" style={{ color: 'hsl(var(--foreground))' }}>{d.title}</span>
                    {d.description && (
                      <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{d.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>{d.responsible ?? '—'}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: PRIORITY_COLORS[d.priority]?.bg, color: PRIORITY_COLORS[d.priority]?.text }}
                    >
                      {PRIORITY_LABELS[d.priority] ?? d.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: STATUS_COLORS[d.status]?.bg, color: STATUS_COLORS[d.status]?.text }}
                    >
                      {STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {d.dueDate ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {d.status === 'open' && (
                        <button
                          onClick={() => updateMutation.mutate({ id: d.id, status: 'in_progress' })}
                          className="p-1 rounded transition-colors hover:bg-accent"
                          title="Iniciar"
                        >
                          <Clock size={14} style={{ color: '#1e40af' }} />
                        </button>
                      )}
                      {(d.status === 'open' || d.status === 'in_progress') && (
                        <button
                          onClick={() => updateMutation.mutate({ id: d.id, status: 'resolved' })}
                          className="p-1 rounded transition-colors hover:bg-accent"
                          title="Resolver"
                        >
                          <CheckCircle2 size={14} style={{ color: '#065f46' }} />
                        </button>
                      )}
                      {(d.status === 'open' || d.status === 'in_progress') && (
                        <button
                          onClick={() => updateMutation.mutate({ id: d.id, status: 'cancelled' })}
                          className="p-1 rounded transition-colors hover:bg-accent"
                          title="Cancelar"
                        >
                          <XCircle size={14} style={{ color: '#6b7280' }} />
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm('Excluir esta demanda?')) deleteMutation.mutate(d.id) }}
                        className="p-1 rounded transition-colors hover:bg-accent"
                        title="Excluir"
                      >
                        <XCircle size={14} style={{ color: '#991b1b' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DemandForm({ onSubmit, onCancel, isLoading }: {
  onSubmit: (body: { type: string; title: string; description?: string; responsible?: string; priority?: string; dueDate?: string }) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [form, setForm] = useState({ type: '', title: '', description: '', responsible: '', priority: 'medium', dueDate: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.type.trim() || !form.title.trim()) return
    onSubmit({
      type: form.type.trim(),
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      responsible: form.responsible.trim() || undefined,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input
          placeholder="Tipo *"
          value={form.type}
          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          className="rounded-md px-3 py-2 text-sm border"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
          required
        />
        <input
          placeholder="Título *"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className="rounded-md px-3 py-2 text-sm border"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
          required
        />
        <input
          placeholder="Responsável"
          value={form.responsible}
          onChange={(e) => setForm((p) => ({ ...p, responsible: e.target.value }))}
          className="rounded-md px-3 py-2 text-sm border"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
        />
        <input
          placeholder="Descrição"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className="rounded-md px-3 py-2 text-sm border"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
        />
        <select
          value={form.priority}
          onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
          className="rounded-md px-3 py-2 text-sm border"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
        >
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
        </select>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
          className="rounded-md px-3 py-2 text-sm border"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
          placeholder="Prazo"
        />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          type="submit"
          disabled={isLoading || !form.type.trim() || !form.title.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          Criar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-xs font-semibold transition-colors hover:bg-accent"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function DemandDetailTable({ type, alerts }: { type: string; alerts: Alerts }) {
  const [page, setPage] = useState(1)

  let items: Array<{ studentId: string; studentName: string; absenceCount?: number }> = []
  let headerBanner: React.ReactNode = null
  let columns: string[] = []

  if (type === 'no-guardian') {
    items = alerts.studentsWithoutGuardians
    columns = ['Aluno']
    headerBanner = (
      <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <AlertTriangle size={14} style={{ color: TONE_CONFIG.amber.iconColor }} />
        <span className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Alunos sem responsável cadastrado
        </span>
      </div>
    )
  } else if (type === 'no-doc') {
    items = alerts.studentsWithoutIdDocument
    columns = ['Aluno']
    headerBanner = (
      <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <FileText size={14} style={{ color: TONE_CONFIG.amber.iconColor }} />
        <span className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Alunos sem documento de identidade
        </span>
      </div>
    )
  } else if (type === 'low-attendance') {
    items = alerts.lowAttendanceStudents
    columns = ['Aluno', 'Faltas (30d)']
  }

  const totalPages = Math.max(1, Math.ceil(items.length / ALERT_PAGE_SIZE))
  const paginated = items.slice((page - 1) * ALERT_PAGE_SIZE, page * ALERT_PAGE_SIZE)

  return (
    <div
      className="mt-2 rounded-xl overflow-hidden"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {headerBanner}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              {columns.map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((s) => (
              <tr
                key={s.studentId}
                className="transition-colors duration-150 hover:bg-accent"
                style={{ borderBottom: '1px solid hsl(var(--border))' }}
              >
                <td className="px-5 py-3">
                  <Link
                    to={`/students/${s.studentId}`}
                    className="font-semibold hover:underline"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    {s.studentName}
                  </Link>
                </td>
                {'absenceCount' in s && s.absenceCount != null && (
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold"
                      style={{ background: TONE_CONFIG.red.iconBg, color: TONE_CONFIG.red.iconColor }}
                    >
                      {s.absenceCount} falta{s.absenceCount !== 1 ? 's' : ''}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-t"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Mostrando {(page - 1) * ALERT_PAGE_SIZE + 1}–{Math.min(page * ALERT_PAGE_SIZE, items.length)} de{' '}
            {items.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded transition-colors disabled:opacity-30 hover:bg-accent"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-1">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className="min-w-[26px] h-[26px] rounded text-xs font-medium transition-colors hover:bg-accent"
                    style={{
                      background: p === page ? 'hsl(var(--primary))' : 'transparent',
                      color: p === page ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded transition-colors disabled:opacity-30 hover:bg-accent"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
