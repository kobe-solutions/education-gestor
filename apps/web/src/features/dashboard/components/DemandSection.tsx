import { useState } from 'react'
import { Link } from 'react-router'
import { AlertCircle, AlertTriangle, FileText, Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { SectionHeader } from './SectionHeader'
import { TONE_CONFIG, type ToneKey } from '../../../lib/colors'
import type { Alerts } from '../hooks/useDashboard'

interface DemandSectionProps {
  alerts: Alerts
  blocked: boolean
}

const ALERT_PAGE_SIZE = 10

// TODO BUG-011: Consider adding a full CRUD backend for demands (POST /demands, PATCH /demands/:id)
// to allow users to create, assign, and resolve demand items beyond the current computed alerts.
// Current alerts are read-only and derived from existing data.

export function DemandSection({ alerts, blocked }: DemandSectionProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

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
    </section>
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
