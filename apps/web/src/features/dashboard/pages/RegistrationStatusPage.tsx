import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, Filter } from 'lucide-react'
import { useRegistrationStatus } from '../hooks/useRegistrationStatus'
import { useTeachers } from '../../teachers/hooks/useTeachers'
import { useClasses } from '../../classes/hooks/useClasses'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { Pagination } from '../../../components/ui/pagination'

const WEEK_DAY_LABELS: Record<string, string> = {
  monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua',
  thursday: 'Qui', friday: 'Sex', saturday: 'Sab',
}

const PAGE_LIMIT = 15

function StatusIcon({ registered }: { registered: boolean }) {
  return registered
    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
    : <XCircle className="h-4 w-4 text-red-500" />
}

export function RegistrationStatusPage() {
  const [teacherFilter, setTeacherFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [page, setPage] = useState(1)

  const filters = {
    ...(teacherFilter ? { teacherId: teacherFilter } : {}),
    ...(classFilter ? { classId: classFilter } : {}),
  }

  const { data, isLoading } = useRegistrationStatus(filters)
  const { data: teachersResult } = useTeachers()
  const teacherList = teachersResult?.data ?? []
  const { data: classes = [] } = useClasses()

  const summary = data?.summary
  const registrationTeachers = data?.data ?? []

  const allRows = registrationTeachers.flatMap((teacher) =>
    teacher.classes.flatMap((cls) =>
      cls.subjects.map((subj) => ({
        key: `${teacher.teacherId}-${cls.classId}-${subj.subjectId}-${subj.weekDay}-${subj.periodName}`,
        teacherName: teacher.teacherName,
        className: cls.className,
        subjectName: subj.subjectName,
        periodStartTime: subj.periodStartTime,
        periodEndTime: subj.periodEndTime,
        weekDay: subj.weekDay,
        attendanceRegistered: subj.attendanceRegistered,
        gradesRegistered: subj.gradesRegistered,
      })),
    ),
  )
  const totalRows = allRows.length
  const paginatedRows = allRows.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT)

  function handleTeacherFilterChange(value: string | null) {
    setTeacherFilter(!value || value === 'all' ? '' : value)
    setPage(1)
  }

  function handleClassFilterChange(value: string | null) {
    setClassFilter(!value || value === 'all' ? '' : value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Registro de Aulas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Acompanhe o status de frequência e notas por professor e turma
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summary.totalSlots}</p>
                  <p className="text-xs text-muted-foreground">Aulas na grade</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {summary.totalSlots > 0
                      ? Math.round((summary.attendanceRegistered / summary.totalSlots) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Frequência registrada</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {summary.totalSlots > 0
                      ? Math.round((summary.gradesRegistered / summary.totalSlots) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Notas lançadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Select value={teacherFilter || 'all'} onValueChange={handleTeacherFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {teacherFilter
                      ? teacherList.find((t) => t.id === teacherFilter)?.name ?? 'Professor'
                      : 'Todos os professores'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os professores</SelectItem>
                  {teacherList.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Select value={classFilter || 'all'} onValueChange={handleClassFilterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {classFilter
                      ? classes.find((c) => c.id === classFilter)?.name ?? 'Turma'
                      : 'Todas as turmas'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : allRows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma aula encontrada na grade horária.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure a grade horária em Locação de Aulas para visualizar o status dos registros.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead className="text-center">Horário</TableHead>
                  <TableHead className="text-center">Dia</TableHead>
                  <TableHead className="text-center">Frequência</TableHead>
                  <TableHead className="text-center">Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.teacherName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.className}</Badge>
                    </TableCell>
                    <TableCell>{row.subjectName}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {row.periodStartTime}–{row.periodEndTime}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {WEEK_DAY_LABELS[row.weekDay] ?? row.weekDay}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <StatusIcon registered={row.attendanceRegistered} />
                        <span className="text-xs text-muted-foreground">
                          {row.attendanceRegistered ? 'Registrada' : 'Pendente'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <StatusIcon registered={row.gradesRegistered} />
                        <span className="text-xs text-muted-foreground">
                          {row.gradesRegistered ? 'Lançada' : 'Pendente'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4">
              <Pagination
                page={page}
                total={totalRows}
                limit={PAGE_LIMIT}
                onPageChange={setPage}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
