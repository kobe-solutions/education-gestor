import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { BookOpen } from 'lucide-react'
import { useClasses, useClass } from '../../classes/hooks/useClasses'
import { useClassGrades } from '../hooks/useAcademic'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { EmptyState } from '../../../components/EmptyState'
import { Pagination } from '../../../components/ui/pagination'
import { formatShiftLabel } from '../../../lib/labels'

const PAGE_SIZE = 10

export function GradesPage() {
  const { data: classes } = useClasses()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClassId = searchParams.get('class') ?? ''
  const selectedSubjectId = searchParams.get('subject') ?? ''
  const selectedPeriodId = searchParams.get('period') ?? ''
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1)
  const { data: grades, isLoading } = useClassGrades(selectedClassId)
  const { data: selectedClass } = useClass(selectedClassId)

  const updateParams = (updates: Record<string, string>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      return next
    })
  }

  const subjects = useMemo(() => {
    const unique = new Map((grades ?? []).filter((grade) => grade.subject).map((grade) => [grade.subject!.id, grade.subject!.name]))
    return [...unique].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
  }, [grades])
  const periods = useMemo(() => {
    const unique = new Map((grades ?? []).filter((grade) => grade.academicPeriod).map((grade) => [grade.academicPeriod!.id, grade.academicPeriod!.name]))
    return [...unique]
  }, [grades])

  const filteredGrades = useMemo(() => (grades ?? []).filter((grade) =>
    (!selectedSubjectId || grade.subjectId === selectedSubjectId) &&
    (!selectedPeriodId || grade.academicPeriodId === selectedPeriodId),
  ), [grades, selectedSubjectId, selectedPeriodId])
  const studentIds = useMemo(() => [...new Set(filteredGrades.map((grade) => grade.studentId))], [filteredGrades])
  const totalPages = Math.max(1, Math.ceil(studentIds.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const visibleStudentIds = new Set(studentIds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE))
  const visibleGrades = filteredGrades.filter((grade) => visibleStudentIds.has(grade.studentId))
  const enrolledStudents = selectedClass?.students ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notas</h1>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="grades-class" className="text-xs text-muted-foreground">Turma</Label>
          <Select value={selectedClassId} onValueChange={(v) => updateParams({ class: v, subject: '', period: '', page: '' })}
            items={classes?.map((c) => ({ value: c.id, label: `${c.name} — ${c.serie?.name ?? formatShiftLabel(c.shift)}` }))}>
            <SelectTrigger id="grades-class" className="w-full min-w-0"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
            <SelectContent>
              {classes?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.serie?.name ?? formatShiftLabel(c.shift)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="grades-subject" className="text-xs text-muted-foreground">Disciplina</Label>
          <Select value={selectedSubjectId || 'all'} onValueChange={(v) => updateParams({ subject: v === 'all' ? '' : v, page: '' })}
            items={[{ value: 'all', label: 'Todas as disciplinas' }, ...subjects.map(([id, name]) => ({ value: id, label: name }))]}>
            <SelectTrigger id="grades-subject" className="w-full min-w-0"><SelectValue placeholder="Todas as disciplinas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as disciplinas</SelectItem>
              {subjects.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="grades-period" className="text-xs text-muted-foreground">Período</Label>
          <Select value={selectedPeriodId || 'all'} onValueChange={(v) => updateParams({ period: v === 'all' ? '' : v, page: '' })}
            items={[{ value: 'all', label: 'Todos os períodos' }, ...periods.map(([id, name]) => ({ value: id, label: name }))]}>
            <SelectTrigger id="grades-period" className="w-full min-w-0"><SelectValue placeholder="Todos os períodos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              {periods.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        </CardContent>
      </Card>

      {!selectedClassId && <EmptyState icon={BookOpen} title="Selecione uma turma" description="Escolha uma turma para consultar as notas lançadas pelos professores." />}

      {selectedClassId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{filteredGrades.length} notas · {studentIds.length} alunos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? <p className="p-6 text-sm text-muted-foreground">Carregando...</p> : (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Disciplina</TableHead><TableHead>Período</TableHead><TableHead>Nota</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {visibleGrades.map((grade) => {
                      const student = enrolledStudents.find((item) => item.id === grade.studentId)
                      return <TableRow key={grade.id}><TableCell>{student?.name ?? grade.studentId}</TableCell><TableCell>{grade.subject?.name ?? '—'}</TableCell><TableCell>{grade.academicPeriod?.name ?? '—'}</TableCell><TableCell className="font-medium">{grade.value}</TableCell></TableRow>
                    })}
                    {visibleGrades.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Nenhuma nota encontrada para os filtros selecionados.</TableCell></TableRow>}
                  </TableBody>
                </Table>
                <Pagination page={page} total={studentIds.length} limit={PAGE_SIZE} itemName="aluno" onPageChange={(nextPage) => updateParams({ page: nextPage > 1 ? String(nextPage) : '' })} />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
