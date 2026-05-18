import { useNavigate } from 'react-router'
import { ChevronRight, GraduationCap, BookOpen, Layers } from 'lucide-react'
import { useEducationLevels, EDUCATION_LEVEL_TYPE_LABELS } from '../../educationLevels/hooks/useEducationLevels'
import { useSeries } from '../../series/hooks/useSeries'
import { useClasses } from '../../classes/hooks/useClasses'
import { Badge } from '../../../components/ui/badge'
import { PageHead } from '../../../components/PageHead'
import { Skeleton } from '../../../components/ui/skeleton'

export function EstruturaPage() {
  const navigate = useNavigate()
  const { data: levels, isLoading: loadingLevels } = useEducationLevels()
  const { data: allSeries, isLoading: loadingSeries } = useSeries()
  const { data: allClasses, isLoading: loadingClasses } = useClasses()

  const isLoading = loadingLevels || loadingSeries || loadingClasses

  const unlinkedClasses = allClasses?.filter((c) => !c.serieId) ?? []

  return (
    <div className="space-y-5">
      <PageHead
        title="Estrutura Escolar"
        subtitle="Hierarquia completa: Nível de Ensino → Série → Turma"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {levels?.map((level) => {
            const levelSeries = (allSeries ?? [])
              .filter((s) => s.educationLevelId === level.id)
              .sort((a, b) => a.order - b.order)

            const levelClassCount = (allClasses ?? []).filter((c) =>
              levelSeries.some((s) => s.id === c.serieId),
            ).length

            return (
              <div
                key={level.id}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--iris-slate-200)', background: '#fff', boxShadow: 'var(--shadow-sm)' }}
              >
                {/* Cabeçalho do nível — fundo tint azul */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors"
                  style={{ background: 'var(--iris-blue-50)', borderBottom: '1px solid var(--iris-slate-200)' }}
                  onClick={() => navigate(`/education-levels/${level.id}/series`)}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#dceefa' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--iris-blue-50)' }}
                >
                  <div
                    className="flex items-center justify-center rounded-xl shrink-0"
                    style={{ width: 36, height: 36, background: 'rgba(24,95,165,0.15)', color: '#185FA5' }}
                  >
                    <Layers size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: 'var(--iris-blue-900)' }}>
                        {level.name}
                      </span>
                      <Badge variant="info" className="text-[10px] h-4 px-1.5">
                        {EDUCATION_LEVEL_TYPE_LABELS[level.type] ?? level.type}
                      </Badge>
                      {!level.active && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--iris-slate-500)' }}>
                      {levelSeries.length} {levelSeries.length === 1 ? 'série' : 'séries'} · {levelClassCount} {levelClassCount === 1 ? 'turma' : 'turmas'}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--iris-slate-500)' }} />
                </div>

                {/* Séries */}
                {levelSeries.length === 0 ? (
                  <div className="px-5 py-3 text-xs italic" style={{ color: 'var(--iris-slate-500)' }}>
                    Nenhuma série cadastrada neste nível.
                  </div>
                ) : (
                  <div>
                    {levelSeries.map((serie, idx) => {
                      const serieClasses = (allClasses ?? []).filter((c) => c.serieId === serie.id)
                      const isLast = idx === levelSeries.length - 1

                      return (
                        <div
                          key={serie.id}
                          className="flex items-start gap-0"
                          style={!isLast ? { borderBottom: '1px solid var(--iris-slate-100)' } : undefined}
                        >
                          {/* Linha de indentação */}
                          <div className="flex justify-center pt-4 shrink-0" style={{ width: 40 }}>
                            <div style={{ width: 1, height: '100%', background: 'var(--iris-slate-200)' }} />
                          </div>

                          <div className="flex-1 py-3 pr-5">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="flex items-center justify-center rounded shrink-0"
                                style={{ width: 22, height: 22, background: 'var(--iris-slate-100)', color: 'var(--iris-slate-500)' }}
                              >
                                <GraduationCap size={12} />
                              </div>
                              <span
                                className="text-sm font-semibold cursor-pointer transition-colors"
                                style={{ color: 'var(--iris-blue-900)' }}
                                onClick={() => navigate('/classes')}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#185FA5' }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--iris-blue-900)' }}
                              >
                                {serie.name}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--iris-slate-500)' }}>
                                {serieClasses.length} {serieClasses.length === 1 ? 'turma' : 'turmas'}
                              </span>
                            </div>

                            {serieClasses.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 ml-7">
                                {serieClasses.map((turma) => (
                                  <button
                                    key={turma.id}
                                    onClick={() => navigate(`/classes/${turma.id}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                                    style={{ border: '1px solid var(--iris-slate-300)', background: '#fff', color: 'var(--iris-slate-700)' }}
                                    onMouseEnter={(e) => {
                                      const el = e.currentTarget as HTMLElement
                                      el.style.background = '#185FA5'
                                      el.style.borderColor = '#185FA5'
                                      el.style.color = '#fff'
                                    }}
                                    onMouseLeave={(e) => {
                                      const el = e.currentTarget as HTMLElement
                                      el.style.background = '#fff'
                                      el.style.borderColor = 'var(--iris-slate-300)'
                                      el.style.color = 'var(--iris-slate-700)'
                                    }}
                                  >
                                    <BookOpen size={11} />
                                    {turma.name}
                                    {turma.shift && (
                                      <span style={{ opacity: 0.65 }}>· {turma.shift}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Turmas sem série — borda tracejada */}
          {unlinkedClasses.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px dashed var(--iris-slate-300)', background: '#fff' }}
            >
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ background: 'var(--iris-slate-50)', borderBottom: '1px dashed var(--iris-slate-200)' }}
              >
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: 36, height: 36, background: 'var(--iris-slate-100)', color: 'var(--iris-slate-500)' }}
                >
                  <BookOpen size={16} />
                </div>
                <div>
                  <span className="font-semibold text-sm" style={{ color: 'var(--iris-slate-700)' }}>
                    Sem série atribuída
                  </span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--iris-slate-500)' }}>
                    {unlinkedClasses.length} {unlinkedClasses.length === 1 ? 'turma' : 'turmas'} sem vínculo com uma série
                  </p>
                </div>
              </div>
              <div className="px-5 py-4 flex flex-wrap gap-1.5">
                {unlinkedClasses.map((turma) => (
                  <button
                    key={turma.id}
                    onClick={() => navigate(`/classes/${turma.id}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                    style={{ border: '1px solid var(--iris-slate-300)', background: '#fff', color: 'var(--iris-slate-700)' }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = '#185FA5'
                      el.style.borderColor = '#185FA5'
                      el.style.color = '#fff'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = '#fff'
                      el.style.borderColor = 'var(--iris-slate-300)'
                      el.style.color = 'var(--iris-slate-700)'
                    }}
                  >
                    <BookOpen size={11} />
                    {turma.name} · {turma.shift}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(!levels || levels.length === 0) && (
            <div
              className="text-center py-12 rounded-xl"
              style={{ border: '1px dashed var(--iris-slate-300)' }}
            >
              <GraduationCap size={32} className="mx-auto mb-3" style={{ color: 'var(--iris-slate-300)' }} />
              <p className="text-sm" style={{ color: 'var(--iris-slate-500)' }}>
                Nenhum nível de ensino cadastrado ainda.
              </p>
              <button
                className="text-sm font-medium mt-1 hover:underline"
                style={{ color: '#185FA5' }}
                onClick={() => navigate('/education-levels')}
              >
                Cadastrar agora
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
