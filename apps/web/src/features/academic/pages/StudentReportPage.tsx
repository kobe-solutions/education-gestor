import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useStudent } from '../../students/hooks/useStudents'
import { useStudentGrades, useStudentAttendances } from '../hooks/useAcademic'
import { Button } from '../../../components/ui/button'
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Voltar" className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1
            className="font-bold truncate"
            style={{ fontSize: 20, color: 'hsl(var(--primary))', letterSpacing: '-0.01em' }}
          >
            {student?.name ?? '...'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Boletim Escolar
          </p>
        </div>
      </div>

      {/* Frequência */}
      <div
        className="rounded-xl p-5"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
      >
        <h2 className="font-semibold text-sm mb-4" style={{ color: 'hsl(var(--primary))' }}>
          Frequência
        </h2>

        {attendanceRate !== null ? (
          <div className="flex items-center gap-4 flex-wrap">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 64, height: 64, background: attendanceRate >= 75 ? 'hsl(var(--badge-success-bg))' : 'hsl(var(--badge-danger-bg))' }}
            >
              <span
                className="text-xl font-bold tabular-nums"
                style={{ color: attendanceRate >= 75 ? 'hsl(var(--badge-success-fg))' : 'hsl(var(--badge-danger-fg))' }}
              >
                {attendanceRate}%
              </span>
            </div>
            <div>
              <Badge variant={attendanceRate >= 75 ? 'success' : 'destructive'}>
                {attendanceRate >= 75 ? 'Frequência Regular' : 'Frequência Irregular'}
              </Badge>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {presentCount} presença{presentCount !== 1 ? 's' : ''} de {totalAttendances} aula{totalAttendances !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Sem registros de frequência
          </p>
        )}
      </div>

      {/* Notas */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="p-5 pb-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--primary))' }}>
            Notas por disciplina
          </h2>
        </div>

        <div className="p-5">
          {!gradesBySubject || Object.keys(gradesBySubject).length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Sem notas registradas
            </p>
          ) : (
            <div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Disciplina</th>
                    {Array.from(new Set(grades?.map((g) => g.academicPeriod?.name ?? g.academicPeriodId))).map((p) => (
                      <th key={p}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(gradesBySubject).map(([subject, entries]) => (
                    <tr key={subject}>
                      <td>
                        <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                          {subject}
                        </span>
                      </td>
                      {entries.map((e) => (
                        <td key={e.period}>
                          <span
                            className="font-semibold tabular-nums"
                            style={{ color: parseFloat(e.value) >= 5 ? 'hsl(142 71% 45%)' : 'hsl(var(--destructive))' }}
                          >
                            {e.value}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
