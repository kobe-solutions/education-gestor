import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useStudent } from '../../students/hooks/useStudents'
import { useStudentGrades, useStudentAttendances } from '../hooks/useAcademic'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'

export function StudentReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: student } = useStudent(id!)
  const { data: grades } = useStudentGrades(id!)
  const { data: attendances } = useStudentAttendances(id!)

  const gradesBySubject = grades?.reduce<Record<string, { period: string; value: string }[]>>((acc, g) => {
    const subjectName = g.subject?.name ?? g.subjectId
    if (!acc[subjectName]) acc[subjectName] = []
    acc[subjectName].push({ period: g.academicPeriod?.name ?? g.academicPeriodId, value: g.value })
    return acc
  }, {})

  const totalAttendances = attendances?.length ?? 0
  const presentCount = attendances?.filter((a) => a.present).length ?? 0
  const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{student?.name ?? '...'}</h1>
          <p className="text-sm text-muted-foreground">Boletim</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Frequência</CardTitle></CardHeader>
        <CardContent>
          {attendanceRate !== null ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{attendanceRate}%</span>
              <Badge variant={attendanceRate >= 75 ? 'success' : 'destructive'}>
                {attendanceRate >= 75 ? 'Regular' : 'Irregular'}
              </Badge>
              <span className="text-sm text-muted-foreground">{presentCount}/{totalAttendances} aulas</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem registros</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Notas por disciplina</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!gradesBySubject || Object.keys(gradesBySubject).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Sem notas registradas</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  {Array.from(new Set(grades?.map((g) => g.academicPeriod?.name ?? g.academicPeriodId))).map((p) => (
                    <TableHead key={p}>{p}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(gradesBySubject).map(([subject, entries]) => (
                  <TableRow key={subject}>
                    <TableCell className="font-medium">{subject}</TableCell>
                    {entries.map((e) => (
                      <TableCell key={e.period}>
                        <span className={parseFloat(e.value) >= 5 ? 'text-green-700 font-medium' : 'text-destructive font-medium'}>
                          {e.value}
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
