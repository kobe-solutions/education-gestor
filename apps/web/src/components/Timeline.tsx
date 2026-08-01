import { Clock, UserPlus, GraduationCap, CreditCard, FileText, CircleDot } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type TimelineTone = 'primary' | 'success' | 'warning' | 'muted'

const TONE_ICON: Record<TimelineTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  muted: 'bg-muted text-muted-foreground',
}

export interface TimelineEntry {
  id: string
  date: string
  title: string
  description?: string
  icon?: LucideIcon
  tone?: TimelineTone
}

const DEFAULT_ICONS: Record<string, LucideIcon> = {
  created: UserPlus,
  class: GraduationCap,
  payment: CreditCard,
  document: FileText,
  status: CircleDot,
}

function fmtDate(value: string) {
  const d = new Date(value.includes('T') ? value : value + 'T12:00:00')
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('pt-BR')
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">Nenhuma atividade registrada</p>
  }

  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  return (
    <ol className="relative space-y-5 border-l-2 ml-3 pl-6" aria-label="Histórico do aluno">
      {sorted.map((entry) => {
        const Icon = entry.icon ?? DEFAULT_ICONS[entry.id.split(':')[0]] ?? Clock
        return (
          <li key={entry.id} className="relative">
            <span
              className={`absolute -left-[calc(1.5rem+6px)] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${TONE_ICON[entry.tone ?? 'muted']}`}
            >
              <Icon className="h-3 w-3" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{entry.title}</p>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {fmtDate(entry.date)}
                </span>
              </div>
              {entry.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
