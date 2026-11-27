import { Link } from 'react-router'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Filter,
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { useLessonRecordSummary } from '../hooks/useLessonRecords'

export function LessonTrackingCard() {
  const { data, isLoading, isError } = useLessonRecordSummary()
  const progress = data?.rate ?? 0
  const metrics = [
    { value: isLoading || isError ? '—' : data?.planned ?? 0, label: 'Aulas planejadas', icon: CalendarClock, tone: '#4f8bd6', background: 'rgba(79,139,214,.10)' },
    { value: isLoading || isError ? '—' : data?.registered ?? 0, label: 'Aulas registradas', icon: CheckCircle2, tone: '#238b57', background: 'rgba(35,139,87,.10)' },
    { value: isLoading || isError ? '—' : data?.pending ?? 0, label: 'Pendentes de registro', icon: AlertCircle, tone: '#d65353', background: 'rgba(214,83,83,.10)' },
    { value: isLoading || isError ? '—' : data?.future ?? 0, label: 'Aulas futuras', icon: Clock, tone: '#c58b18', background: 'rgba(197,139,24,.10)' },
  ]

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5" aria-labelledby="lesson-tracking-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="lesson-tracking-title" className="flex items-center gap-2 text-base font-semibold">
            <ClipboardList className="size-4" />
            Acompanhamento de Aulas
          </h2>
          <p className="text-xs text-muted-foreground">
            {new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} a {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <Link to="/lesson-records">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="size-3.5" />
            Filtros
          </Button>
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {metrics.map(({ value, label, icon: Icon, tone, background }) => (
          <div key={label} className="flex min-w-0 items-center gap-3 rounded-lg px-3 py-3 sm:px-4" style={{ background }}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ color: tone, background: 'hsl(var(--card) / .72)' }}>
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-bold tabular-nums leading-none" style={{ color: tone }}>{value}</span>
              <span className="mt-1 block text-[11px] leading-tight text-muted-foreground">{label}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{isLoading || isError ? '—' : progress}%</strong> das aulas ministradas foram registradas</span>
        <span className="text-destructive">• {isLoading || isError ? '—' : data?.pending ?? 0} aula(s) aguardando registro</span>
        {isError && <span role="status">Não foi possível carregar o acompanhamento.</span>}
      </div>
    </section>
  )
}
