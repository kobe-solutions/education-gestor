import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, CalendarClock } from 'lucide-react'
import { useClass } from '../hooks/useClasses'
import { useTimetableSlots } from '../../timetable/hooks/useTimetable'
import { useClassPeriods } from '../hooks/useClasses'
import { WeekGrid } from '../../timetable/components/WeekGrid'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: schoolClass, isLoading } = useClass(id!)
  const { data: slots = [], isLoading: slotsLoading } = useTimetableSlots(id!)
  const { data: classPeriods = [] } = useClassPeriods()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!schoolClass) {
    return <p className="text-sm text-destructive">Turma não encontrada</p>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Acadêmico', to: '/' },
          { label: 'Turmas', to: '/structure/classes' },
          { label: schoolClass.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Voltar" aria-label="Voltar" className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1
            className="font-bold truncate"
            style={{ fontSize: 20, color: 'hsl(var(--primary))', letterSpacing: '-0.01em' }}
          >
            {schoolClass.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {schoolClass.serie?.name ?? '—'} · {schoolClass.shift}
            {schoolClass.academicPeriod ? ` · ${schoolClass.academicPeriod.name}` : ''}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate(`/classes/${id}/timetable`)}>
          <CalendarClock className="h-4 w-4 mr-1" />
          Grade Horária
        </Button>
      </div>

      {/* Calendário Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Grade Horária Semanal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <WeekGrid slots={slots} classPeriods={classPeriods} loading={slotsLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
