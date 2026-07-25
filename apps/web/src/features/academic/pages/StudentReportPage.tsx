import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { useStudent } from '../../students/hooks/useStudents'
import { useStudentGrades, useStudentAttendances } from '../hooks/useAcademic'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'

export function StudentReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: student } = useStudent(id!)
  const { data: grades } = useStudentGrades(id!)
  const { data: attendances } = useStudentAttendances(id!)

  const gradesBySubject = useMemo(() => {
    if (!grades) return null
    return grades.reduce<Record<string, { period: string; value: string }[]>>((acc, g) => {
      const subjectName = g.subject?.name ?? g.subjectId
      if (!acc[subjectName]) acc[subjectName] = []
      acc[subjectName].push({ period: g.academicPeriod?.name ?? g.academicPeriodId, value: g.value })
      return acc
    }, {})
  }, [grades])

  const periodNames = useMemo(() => {
    if (!grades) return []
    return Array.from(new Set(grades.map((g) => g.academicPeriod?.name ?? g.academicPeriodId)))
  }, [grades])

  const subjectStats = useMemo(() => {
    if (!gradesBySubject) return []
    return Object.entries(gradesBySubject).map(([subject, entries]) => {
      const avg = entries.reduce((sum, e) => sum + parseFloat(e.value), 0) / entries.length
      return { subject, average: avg, passed: avg >= 5, entries }
    })
  }, [gradesBySubject])

  const overallAverage = useMemo(() => {
    if (subjectStats.length === 0) return null
    return subjectStats.reduce((sum, s) => sum + s.average, 0) / subjectStats.length
  }, [subjectStats])

  const allPassed = subjectStats.length > 0 && subjectStats.every((s) => s.passed)
  const approvedCount = subjectStats.filter((s) => s.passed).length

  const totalAttendances = attendances?.length ?? 0
  const presentCount = attendances?.filter((a) => a.present).length ?? 0
  const attendanceRate = totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Pessoas', to: '/' },
          { label: 'Alunos', to: '/students' },
          { label: student?.name ?? '...', to: `/students/${id}` },
          { label: 'Boletim' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Voltar" aria-label="Voltar" className="shrink-0">
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

      {/* Resumo Geral */}
      {subjectStats.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
        >
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'hsl(var(--primary))' }}>
            Resumo Geral
          </h2>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex flex-col items-center">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 64, height: 64, background: allPassed ? 'hsl(var(--badge-success-bg))' : 'hsl(var(--badge-danger-bg))' }}
              >
                <span
                  className="text-xl font-bold tabular-nums"
                  style={{ color: allPassed ? 'hsl(var(--badge-success-fg))' : 'hsl(var(--badge-danger-fg))' }}
                >
                  {overallAverage?.toFixed(1) ?? '—'}
                </span>
              </div>
              <span className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Média Geral</span>
            </div>
            <div>
              <Badge variant={allPassed ? 'success' : 'destructive'} className="text-xs">
                {allPassed ? 'Aprovado' : 'Reprovado'}
              </Badge>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {approvedCount} de {subjectStats.length} disciplina{subjectStats.length !== 1 ? 's' : ''} aprovada{approvedCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Notas por disciplina */}
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
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <BookOpen size={22} className="text-muted-foreground/40" />
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Sem notas registradas
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Notas por disciplina">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Disciplina
                    </th>
                    {periodNames.map((p) => (
                      <th key={p} className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {p}
                      </th>
                    ))}
                    <th className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Média
                    </th>
                    <th className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Situação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subjectStats.map(({ subject, average, passed, entries }) => (
                    <tr key={subject} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                          {subject}
                        </span>
                      </td>
                      {periodNames.map((p) => {
                        const entry = entries.find((e) => e.period === p)
                        return (
                          <td key={p} className="text-center px-3 py-2.5">
                            {entry ? (
                              <span
                                className="font-semibold tabular-nums"
                                style={{ color: parseFloat(entry.value) >= 5 ? 'hsl(142 71% 45%)' : 'hsl(var(--destructive))' }}
                              >
                                {entry.value}
                              </span>
                            ) : (
                              <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center px-3 py-2.5">
                        <span className="font-bold tabular-nums" style={{ color: passed ? 'hsl(142 71% 45%)' : 'hsl(var(--destructive))' }}>
                          {average.toFixed(1)}
                        </span>
                      </td>
                      <td className="text-center px-3 py-2.5">
                        <Badge variant={passed ? 'success' : 'destructive'} className="text-[10px]">
                          {passed ? 'Aprovado' : 'Reprovado'}
                        </Badge>
                      </td>
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
