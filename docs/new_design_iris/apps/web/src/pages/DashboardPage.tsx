import { Link } from 'react-router'
import { Users, GraduationCap, BookOpen, AlertCircle, CheckCircle2, Clock, Building2, School } from 'lucide-react'
import { useDashboard, isAdminDashboard } from '../features/dashboard/hooks/useDashboard'
import { useAuth } from '../contexts/AuthContext'
import { useSchoolContext } from '../contexts/SchoolContext'
import { TuitionStatusBadge } from '../features/financial/components/TuitionStatusBadge'
import { Card, CardContent } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Skeleton } from '../components/ui/skeleton'
import { Button } from '../components/ui/button'

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 pt-6">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { payload } = useAuth()
  const { activeSchoolId } = useSchoolContext()
  const { data, isLoading } = useDashboard()

  const isSecretariaWithoutSchool = payload?.role === 'secretaria' && !activeSchoolId

  if (isSecretariaWithoutSchool) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <School className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">Nenhuma escola selecionada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione uma escola para visualizar o dashboard
          </p>
        </div>
        <Link to="/my-schools">
          <Button size="sm">Ir para Minhas Escolas</Button>
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <SkeletonCards count={payload?.role === 'admin' ? 2 : 6} />
      </div>
    )
  }

  if (!data) return null

  if (isAdminDashboard(data)) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <MetricCard icon={Building2} label="Secretarias" value={data.secretariasCount} color="bg-violet-500" />
          <MetricCard icon={School} label="Escolas" value={data.schoolsCount} color="bg-blue-500" />
        </div>
      </div>
    )
  }

  const fmt = (v: string) => `R$ ${parseFloat(v).toFixed(2)}`

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={Users} label="Alunos" value={data.studentsCount} color="bg-blue-500" />
        <MetricCard icon={GraduationCap} label="Professores" value={data.teachersCount} color="bg-indigo-500" />
        <MetricCard icon={BookOpen} label="Turmas" value={data.classesCount} color="bg-violet-500" />
        <MetricCard
          icon={Clock}
          label="Pendentes"
          value={data.tuitions.pending.count}
          sub={fmt(data.tuitions.pending.total)}
          color="bg-yellow-500"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Pagas"
          value={data.tuitions.paid.count}
          sub={fmt(data.tuitions.paid.total)}
          color="bg-green-500"
        />
        <MetricCard
          icon={AlertCircle}
          label="Atrasadas"
          value={data.tuitions.overdue.count}
          sub={fmt(data.tuitions.overdue.total)}
          color="bg-red-500"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Mensalidades vencendo nos próximos 7 dias</h2>
          <Link to="/financial">
            <Button variant="outline" size="sm">Ver todas</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.upcomingTuitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma mensalidade vencendo nos próximos 7 dias
                    </TableCell>
                  </TableRow>
                ) : (
                  data.upcomingTuitions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Link to={`/students/${t.studentId}`} className="font-medium hover:underline">
                          {t.studentName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {new Date(t.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{fmt(t.amount)}</TableCell>
                      <TableCell>
                        <TuitionStatusBadge status={t.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
