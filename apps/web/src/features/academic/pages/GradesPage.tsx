import { useSearchParams } from 'react-router'
import { BookOpen } from 'lucide-react'
import { useClasses, useClass } from '../../classes/hooks/useClasses'
import { useClassGrades } from '../hooks/useAcademic'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { EmptyState } from '../../../components/EmptyState'

export function GradesPage() {
  const { data: classes } = useClasses()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClassId = searchParams.get('class') ?? ''
  const { data: grades, isLoading } = useClassGrades(selectedClassId)
  const { data: selectedClass } = useClass(selectedClassId)

  const enrolledStudents = selectedClass?.students ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notas</h1>
      </div>

      <div className="w-64">
        <Label>Turma</Label>
        <Select value={selectedClassId} onValueChange={(v) => setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v) next.delete('class'); else next.set('class', v); return next })}
          items={classes?.map((c) => ({ value: c.id, label: `${c.name} — ${c.serie?.name ?? c.shift}` }))}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a turma" />
          </SelectTrigger>
          <SelectContent>
            {classes?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name} — {c.serie?.name ?? c.shift}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedClassId && (
        <EmptyState
          icon={BookOpen}
          title="Selecione uma turma"
          description="Escolha uma turma para consultar as notas lançadas pelos professores."
        />
      )}

      {selectedClassId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{grades?.length ?? 0} notas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades?.map((g) => {
                    const student = enrolledStudents.find((s) => s.id === g.studentId)
                    return (
                      <TableRow key={g.id}>
                        <TableCell>{student?.name ?? g.studentId}</TableCell>
                        <TableCell>{g.subject?.name ?? '—'}</TableCell>
                        <TableCell>{g.academicPeriod?.name ?? '—'}</TableCell>
                        <TableCell className="font-medium">{g.value}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
