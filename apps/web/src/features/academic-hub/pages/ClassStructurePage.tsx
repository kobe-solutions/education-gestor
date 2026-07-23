import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  ChevronRight, ChevronDown, Users, BookOpen,
  GraduationCap, UserCircle2, Search, ExternalLink,
} from 'lucide-react'
import { useSeries } from '../../series/hooks/useSeries'
import { useClasses, useClass } from '../../classes/hooks/useClasses'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'

// ─── Utilitários ──────────────────────────────────────────────────────────────

const SHIFT_CONFIG: Record<string, { label: string; className: string }> = {
  manha:    { label: 'Manhã',    className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  tarde:    { label: 'Tarde',    className: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  noite:    { label: 'Noite',    className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  integral: { label: 'Integral', className: 'bg-green-500/10 text-green-400 border-green-500/30' },
}

const LEVEL_COLORS: Record<string, string> = {
  fundamental: 'bg-blue-500',
  medio:       'bg-violet-500',
  tecnico:     'bg-teal-500',
  superior:    'bg-rose-500',
}

function shiftConfig(shift: string) {
  return SHIFT_CONFIG[shift.toLowerCase()] ?? { label: shift, className: 'bg-muted text-muted-foreground border-border' }
}

function levelColor(type: string) {
  return LEVEL_COLORS[type?.toLowerCase()] ?? 'bg-gray-400'
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

// ─── Componente: lista de alunos de uma turma (carregamento lazy) ─────────────

function ClassStudentsList({ classId, search }: { classId: string; search: string }) {
  const navigate = useNavigate()
  const { data: schoolClass, isLoading } = useClass(classId)

  if (isLoading) {
    return (
      <div className="space-y-1.5 px-4 pb-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}
      </div>
    )
  }

  const students = schoolClass?.students ?? []
  const filtered = search
    ? students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : students

  if (filtered.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4 px-4">
        {students.length === 0 ? 'Nenhum aluno matriculado nesta turma' : 'Nenhum aluno encontrado'}
      </p>
    )
  }

  return (
    <div className="pb-2 px-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5 px-2">
        {filtered.map((student) => (
          <button
            key={student.id}
            onClick={() => navigate(`/students/${student.id}/edit`)}
            className="group flex items-center gap-3 rounded-md border border-transparent bg-card px-3 py-2 text-left transition-all hover:border-border hover:shadow-sm active:scale-[0.99]"
          >
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-primary">
                {initials(student.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{student.name}</p>
              <p className="text-[11px] text-muted-foreground">{student.enrollmentCode}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Componente: Turma (expansível) ──────────────────────────────────────────

interface ClassRowProps {
  schoolClass: {
    id: string
    name: string
    shift: string
  }
  studentCount: number
  search: string
}

function ClassRow({ schoolClass, studentCount, search }: ClassRowProps) {
  const [expanded, setExpanded] = useState(false)
  const sc = shiftConfig(schoolClass.shift)

  return (
    <div className={`rounded-xl border transition-all ${expanded ? 'border-border shadow-sm' : 'border-border/50 hover:border-border'}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />

        <span className="font-medium text-sm flex-1">{schoolClass.name}</span>

        <span className={`text-[10px] border rounded px-1.5 py-0.5 font-medium ${sc.className}`}>
          {sc.label}
        </span>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{studentCount}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t bg-muted/20">
          {studentCount === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-5 px-4">
              Nenhum aluno matriculado nesta turma
            </p>
          ) : (
            <ClassStudentsList classId={schoolClass.id} search={search} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente: Série (expansível) ──────────────────────────────────────────

interface SerieGroupProps {
  serieName: string
  classes: {
    id: string
    name: string
    shift: string
    studentCount?: number
  }[]
  studentSearch: string
  defaultOpen?: boolean
}

function SerieGroup({ serieName, classes, studentSearch, defaultOpen = false }: SerieGroupProps) {
  const [open, setOpen] = useState(defaultOpen)
  const totalStudents = classes.reduce((acc, c) => acc + (c.studentCount ?? 0), 0)

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-1.5 px-1 rounded-md hover:bg-muted/50 transition-colors"
      >
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        }
        <span className="text-sm font-semibold">{serieName}</span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
          {classes.length} {classes.length === 1 ? 'turma' : 'turmas'}
        </Badge>
        <span className="text-xs text-muted-foreground ml-1">· {totalStudents} alunos</span>
      </button>

      {open && (
        <div className="space-y-2 ml-4 pl-3 border-l-2 border-muted">
          {classes.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 px-2">Nenhuma turma nesta série</p>
          ) : (
            classes
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => (
                <ClassRow
                  key={c.id}
                  schoolClass={c}
                  studentCount={c.studentCount ?? 0}
                  search={studentSearch}
                />
              ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente: Nível de ensino (seção) ──────────────────────────────────────

interface LevelSectionProps {
  levelName: string
  levelType: string
  seriesWithClasses: {
    serie: { id: string; name: string }
    classes: {
      id: string
      name: string
      shift: string
      studentCount?: number
    }[]
  }[]
  studentSearch: string
}

function LevelSection({ levelName, levelType, seriesWithClasses, studentSearch }: LevelSectionProps) {
  const totalClasses = seriesWithClasses.reduce((acc, s) => acc + s.classes.length, 0)
  const totalStudents = seriesWithClasses.reduce(
    (acc, s) => acc + s.classes.reduce((a, c) => a + (c.studentCount ?? 0), 0),
    0,
  )
  const color = levelColor(levelType)

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
        <div className={`h-9 w-9 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base">{levelName}</h3>
          <p className="text-[11px] text-muted-foreground">
            {seriesWithClasses.length} {seriesWithClasses.length === 1 ? 'série' : 'séries'} ·{' '}
            {totalClasses} {totalClasses === 1 ? 'turma' : 'turmas'} ·{' '}
            {totalStudents} alunos
          </p>
        </div>
      </div>

      <div className="p-4 space-y-1">
        {seriesWithClasses
          .sort((a, b) => a.serie.name.localeCompare(b.serie.name))
          .map(({ serie, classes }, idx) => (
            <SerieGroup
              key={serie.id}
              serieName={serie.name}
              classes={classes}
              studentSearch={studentSearch}
              defaultOpen={idx === 0}
            />
          ))}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function ClassStructurePage() {
  const { data: series = [] } = useSeries()
  const { data: allClasses = [], isLoading } = useClasses()
  const [studentSearch, setStudentSearch] = useState('')
  const [levelSearch, setLevelSearch] = useState('')

  // Agrupa classes por serieId
  const classesBySerie = allClasses.reduce<Record<string, typeof allClasses>>((acc, c) => {
    const key = c.serieId ?? '__sem_serie__'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  // Agrupa séries por nível de ensino
  const byLevel = series.reduce<Record<string, {
    levelName: string
    levelType: string
    seriesWithClasses: { serie: (typeof series)[0]; classes: typeof allClasses }[]
  }>>((acc, serie) => {
    const levelId = serie.educationLevelId
    const levelName = serie.educationLevel?.name ?? 'Sem nível'
    const levelType = serie.educationLevel?.type ?? ''

    if (!acc[levelId]) {
      acc[levelId] = { levelName, levelType, seriesWithClasses: [] }
    }

    acc[levelId].seriesWithClasses.push({
      serie,
      classes: classesBySerie[serie.id] ?? [],
    })

    return acc
  }, {})

  // Classes sem série
  const classesWithoutSerie = classesBySerie['__sem_serie__'] ?? []

  const filteredLevels = Object.entries(byLevel).filter(([, v]) =>
    v.levelName.toLowerCase().includes(levelSearch.toLowerCase()),
  )

  const totalAlunos = allClasses.reduce((acc, c) => acc + (c.studentCount ?? 0), 0)

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Acadêmico</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {series.length} séries · {allClasses.length} turmas · {totalAlunos} alunos matriculados
          </p>
        </div>
      </div>

      {/* Barra de busca dupla */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filtrar por aluno..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nível de ensino..."
            value={levelSearch}
            onChange={(e) => setLevelSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border p-5 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLevels.length === 0 && classesWithoutSerie.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center">
              <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum nível de ensino cadastrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Configure séries e turmas na aba de Estrutura
              </p>
            </div>
          ) : (
            filteredLevels.map(([levelId, level]) => (
              <LevelSection
                key={levelId}
                levelName={level.levelName}
                levelType={level.levelType}
                seriesWithClasses={level.seriesWithClasses}
                studentSearch={studentSearch}
              />
            ))
          )}

          {/* Turmas sem série */}
          {classesWithoutSerie.length > 0 && !levelSearch && (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b bg-muted/30">
                <div className="h-9 w-9 rounded-xl bg-gray-400 flex items-center justify-center">
                  <UserCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Sem série</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {classesWithoutSerie.length} {classesWithoutSerie.length === 1 ? 'turma' : 'turmas'} não vinculadas a nenhuma série
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {classesWithoutSerie.map((c) => (
                  <ClassRow
                    key={c.id}
                    schoolClass={c}
                    studentCount={c.studentCount ?? 0}
                    search={studentSearch}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
