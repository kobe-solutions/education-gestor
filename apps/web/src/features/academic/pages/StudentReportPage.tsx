import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, BookOpen, Printer } from 'lucide-react'
import { useStudent } from '../../students/hooks/useStudents'
import { useStudentReport } from '../hooks/useAcademic'
import { useSchoolKey } from '../../../lib/useSchoolKey'
import { useSchool } from '../../schools/hooks/useSchools'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import type { ReportSituation } from '@education-gestor/types'

const SITUATION_CONFIG: Record<ReportSituation, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  approved: { label: 'Aprovado', variant: 'success' },
  recovery: { label: 'Recuperação', variant: 'warning' },
  failed: { label: 'Reprovado', variant: 'destructive' },
}

function situationColor(status: ReportSituation | null | undefined) {
  if (status === 'approved') return 'hsl(142 71% 45%)'
  if (status === 'recovery') return 'hsl(32 95% 44%)'
  return 'hsl(var(--destructive))'
}

function formatGeneratedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function StudentReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: student } = useStudent(id!)
  const { data: report, isLoading } = useStudentReport(id!)
  const { schoolKey } = useSchoolKey()
  const { data: school } = useSchool(schoolKey && schoolKey !== 'admin' ? schoolKey : '')

  const overall = report?.overall
  const overallStatus = overall?.status ?? null
  const attendance = overall?.attendance
  const hasData = (report?.subjects.length ?? 0) > 0
  const periods = report?.periods ?? []

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:max-w-full">
      <Breadcrumbs
        className="print:hidden"
        items={[
          { label: 'Pessoas', to: '/' },
          { label: 'Alunos', to: '/students' },
          { label: student?.name ?? '...', to: `/students/${id}` },
          { label: 'Boletim' },
        ]}
      />

      {/* Cabeçalho do documento — visível apenas na impressão */}
      <div className="hidden print:block text-center border-b border-black pb-4 mb-6">
        <h1 className="text-lg font-bold">{school?.name ?? 'Boletim Escolar'}</h1>
        <p className="text-sm">Boletim Escolar — Situação Final</p>
        <p className="text-xs text-black/70">
          Aluno: {report?.studentName ?? student?.name ?? '—'} · Matrícula: {report?.enrollmentCode ?? '—'}
        </p>
        <p className="text-xs text-black/70">
          Emitido em {report?.generatedAt ? formatGeneratedAt(report.generatedAt) : '—'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
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
            Boletim Escolar · Situação Final
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} title="Imprimir boletim" aria-label="Imprimir boletim">
          <Printer className="h-4 w-4" />
          <span className="ml-2">Imprimir</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Resumo Geral */}
          <div
            className="rounded-xl p-5 print:shadow-none print:border print:border-black"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--primary))' }}>
                Situação Final
              </h2>
              {overallStatus && (
                <Badge variant={SITUATION_CONFIG[overallStatus].variant} className="text-xs">
                  {SITUATION_CONFIG[overallStatus].label}
                </Badge>
              )}
            </div>
            <h2 className="hidden print:block font-semibold text-sm mb-4">Situação Final</h2>

            {hasData ? (
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex flex-col items-center">
                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 64, height: 64, background: `color-mix(in srgb, ${situationColor(overallStatus)} 12%, transparent)` }}
                  >
                    <span
                      className="text-xl font-bold tabular-nums"
                      style={{ color: overallStatus ? situationColor(overallStatus) : 'hsl(var(--muted-foreground))' }}
                    >
                      {overall?.average?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                  <span className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Média Geral</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {overallStatus ? SITUATION_CONFIG[overallStatus].label : 'Sem notas'}
                    </span>
                    {overallStatus && (
                      <Badge variant={SITUATION_CONFIG[overallStatus].variant} className="hidden print:inline-flex text-[10px]">
                        {SITUATION_CONFIG[overallStatus].label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {overall?.approvedSubjects ?? 0} de {overall?.totalSubjects ?? 0} disciplina{(overall?.totalSubjects ?? 0) !== 1 ? 's' : ''} aprovada{(overall?.approvedSubjects ?? 0) !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Frequência: {attendance?.rate !== null && attendance?.rate !== undefined ? `${attendance.rate}%` : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Sem notas registradas para este aluno.
              </p>
            )}

            <p className="text-[10px] mt-4 leading-relaxed print:mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Aprovado: média ≥ 5,0 e frequência ≥ 75% · Recuperação: média de 3,0 a 4,9 · Reprovado: média &lt; 3,0 ou frequência &lt; 75%
            </p>
          </div>

          {/* Notas por disciplina */}
          <div
            className="rounded-xl overflow-hidden print:shadow-none print:border print:border-black"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="p-5 pb-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--primary))' }}>
                Notas por disciplina
              </h2>
            </div>

            <div className="p-5">
              {!hasData ? (
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
                        {report?.periods.map((p) => (
                          <th key={p.id} className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {p.name}
                          </th>
                        ))}
                        <th className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Média
                        </th>
                        <th className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Frequência
                        </th>
                        <th className="text-center px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Situação
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report?.subjects.map((subject) => {
                        const status = subject.status
                        const config = status ? SITUATION_CONFIG[status] : null
                        return (
                          <tr key={subject.subjectId} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                            <td className="px-3 py-2.5">
                              <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                                {subject.subjectName}
                              </span>
                              {subject.className && (
                                <span className="block text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  {subject.className}
                                </span>
                              )}
                            </td>
                            {periods.map((p) => {
                              const grade = subject.grades.find((g) => g.academicPeriodId === p.id)
                              return (
                                <td key={p.id} className="text-center px-3 py-2.5">
                                  {grade ? (
                                    <span
                                      className="font-semibold tabular-nums"
                                      style={{ color: parseFloat(grade.value) >= 5 ? 'hsl(142 71% 45%)' : 'hsl(var(--destructive))' }}
                                    >
                                      {grade.value}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="text-center px-3 py-2.5">
                              <span className="font-bold tabular-nums" style={{ color: status ? situationColor(status) : 'hsl(var(--muted-foreground))' }}>
                                {subject.average?.toFixed(1) ?? '—'}
                              </span>
                            </td>
                            <td className="text-center px-3 py-2.5">
                              {subject.attendance?.rate != null ? (
                                <span
                                  className="font-semibold tabular-nums"
                                  style={{ color: subject.attendance.rate >= 75 ? 'hsl(142 71% 45%)' : 'hsl(var(--destructive))' }}
                                >
                                  {subject.attendance.rate}%
                                </span>
                              ) : (
                                <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>
                              )}
                            </td>
                            <td className="text-center px-3 py-2.5">
                              {config ? (
                                <Badge variant={config.variant} className="text-[10px]">
                                  {config.label}
                                </Badge>
                              ) : (
                                <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                          Média Geral
                        </td>
                        <td colSpan={periods.length} />
                        <td className="text-center px-3 py-2.5">
                          <span
                            className="font-bold tabular-nums"
                            style={{ color: overall?.average != null && overallStatus ? situationColor(overallStatus) : 'hsl(var(--muted-foreground))' }}
                          >
                            {overall?.average?.toFixed(1) ?? '—'}
                          </span>
                        </td>
                        <td className="text-center px-3 py-2.5">
                          <span
                            className="font-semibold tabular-nums"
                            style={{ color: attendance?.rate != null ? situationColor(overallStatus) : 'hsl(var(--muted-foreground))' }}
                          >
                            {attendance?.rate != null ? `${attendance.rate}%` : '—'}
                          </span>
                        </td>
                        <td className="text-center px-3 py-2.5">
                          {overallStatus && (
                            <Badge variant={SITUATION_CONFIG[overallStatus].variant} className="text-[10px]">
                              {SITUATION_CONFIG[overallStatus].label}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Rodapé do documento — visível apenas na impressão */}
          <p className="hidden print:block text-[10px] text-black/60 pt-4">
            Documento emitido por {school?.name ?? 'Education Gestor'} em {report?.generatedAt ? formatGeneratedAt(report.generatedAt) : '—'}. Regras: Aprovado — média ≥ 5,0 e frequência ≥ 75%; Recuperação — média de 3,0 a 4,9; Reprovado — média &lt; 3,0 ou frequência &lt; 75%.
          </p>
        </>
      )}
    </div>
  )
}
