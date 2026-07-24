import { useNavigate } from 'react-router'
import { ChevronRight, GraduationCap, BookOpen, Layers } from 'lucide-react'
import { useEducationLevels, EDUCATION_LEVEL_TYPE_LABELS } from '../../educationLevels/hooks/useEducationLevels'
import { useSeries } from '../../series/hooks/useSeries'
import { useClasses } from '../../classes/hooks/useClasses'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'

export function EstruturaPage() {
  const navigate = useNavigate()
  const { data: levels, isLoading: loadingLevels } = useEducationLevels()
  const { data: allSeries, isLoading: loadingSeries } = useSeries()
  const { data: allClasses, isLoading: loadingClasses } = useClasses()

  const isLoading = loadingLevels || loadingSeries || loadingClasses

  const unlinkedClasses = allClasses?.filter((c) => !c.serieId) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Estrutura Escolar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hierarquia completa: Nível de Ensino → Série → Turma
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-primary/20 border border-primary/40" />
            Nível de ensino
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-muted border" />
            Série
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-secondary border" />
            Turma
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
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
                className="border rounded-lg overflow-hidden"
              >
                {/* Cabeçalho do nível */}
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-b cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => navigate(`/education-levels/${level.id}/series`)}
                >
                  <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{level.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        {EDUCATION_LEVEL_TYPE_LABELS[level.type] ?? level.type}
                      </Badge>
                      {!level.active && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Inativo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {levelSeries.length} {levelSeries.length === 1 ? 'série' : 'séries'} · {levelClassCount} {levelClassCount === 1 ? 'turma' : 'turmas'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>

                {/* Séries */}
                {levelSeries.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-muted-foreground italic">
                    Nenhuma série cadastrada neste nível.
                  </div>
                ) : (
                  <div className="divide-y">
                    {levelSeries.map((serie) => {
                      const serieClasses = (allClasses ?? []).filter(
                        (c) => c.serieId === serie.id,
                      )

                      return (
                        <div key={serie.id} className="flex items-start gap-0">
                          {/* Linha de indentação */}
                          <div className="w-10 shrink-0 flex justify-center pt-3.5">
                            <div className="w-px h-full bg-border" />
                          </div>

                          <div className="flex-1 py-2.5 pr-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
                                <GraduationCap className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <span
                                className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                                onClick={() => navigate('/classes')}
                              >
                                {serie.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {serieClasses.length} {serieClasses.length === 1 ? 'turma' : 'turmas'}
                              </span>
                            </div>

                            {serieClasses.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 ml-8">
                                {serieClasses.map((turma) => (
                                  <button
                                    key={turma.id}
                                    onClick={() => navigate(`/classes/${turma.id}`)}
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                                      'bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary',
                                    )}
                                  >
                                    <BookOpen className="h-3 w-3" />
                                    {turma.name}
                                    {turma.shift && (
                                      <span className="text-muted-foreground group-hover:text-primary-foreground">
                                        · {turma.shift}
                                      </span>
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

          {/* Turmas sem série */}
          {unlinkedClasses.length > 0 && (
            <div className="border rounded-lg overflow-hidden border-dashed">
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-medium text-sm text-muted-foreground">Sem série atribuída</span>
                  <p className="text-xs text-muted-foreground">{unlinkedClasses.length} {unlinkedClasses.length === 1 ? 'turma' : 'turmas'} sem vínculo com uma série</p>
                </div>
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-1.5">
                {unlinkedClasses.map((turma) => (
                  <button
                    key={turma.id}
                    onClick={() => navigate(`/classes/${turma.id}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    <BookOpen className="h-3 w-3" />
                    {turma.name} · {turma.shift}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(!levels || levels.length === 0) && (
            <div className="text-center py-12 text-sm text-muted-foreground border rounded-lg border-dashed">
              Nenhum nível de ensino cadastrado ainda.{' '}
              <button
                className="text-primary hover:underline"
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
