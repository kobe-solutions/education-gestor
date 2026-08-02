import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Plus, Pencil, Trash2, UserPlus, Upload, SlidersHorizontal, X } from 'lucide-react'
import { useStudents, useDeleteStudent } from '../hooks/useStudents'
import { useClasses, useClass } from '../../classes/hooks/useClasses'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Input } from '../../../components/ui/input'
import { SearchInput } from '../../../components/SearchInput'
import { StatusBadge } from '../../../components/StatusBadge'
import { DataTable, type Column } from '../../../components/DataTable'
import { cn } from '../../../lib/utils'
import type { Student } from '@education-gestor/types'

const PAGE_SIZE = 15

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const columnsBase: Column<Student>[] = [
  {
    key: 'avatar',
    label: '',
    width: 48,
    render: (s) => (
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white shrink-0"
        style={{ background: 'hsl(var(--primary))' }}
      >
        {s.photoUrl ? (
          <img src={s.photoUrl} alt={s.name} className="w-8 h-8 rounded-full object-cover" loading="lazy" decoding="async"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          getInitials(s.name)
        )}
      </div>
    ),
  },
  {
    key: 'name',
    label: 'Nome',
    sortable: true,
    render: (s) => (
      <span className="font-semibold" style={{ color: 'hsl(var(--primary))' }}>
        {s.name}
      </span>
    ),
  },
  {
    key: 'enrollmentCode',
    label: 'Matrícula',
    render: (s) => (
      <span className="mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
        {s.enrollmentCode}
      </span>
    ),
  },
  {
    key: 'enrollmentStatus',
    label: 'Situação',
    render: (s) => <StatusBadge status={s.enrollmentStatus} kind="enrollment" />,
  },
]

export function StudentsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'
  const sexFilter = searchParams.get('sex') ?? 'all'
  const classFilter = searchParams.get('classId') ?? 'all'
  const minAge = searchParams.get('minAge') ?? ''
  const maxAge = searchParams.get('maxAge') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { data, isLoading } = useStudents({
    page,
    limit: PAGE_SIZE,
    search,
    status: statusFilter,
    sex: sexFilter,
    minAge: minAge ? Number(minAge) : undefined,
    maxAge: maxAge ? Number(maxAge) : undefined,
  })
  const { data: classes } = useClasses()
  const { data: classDetail } = useClass(classFilter !== 'all' ? classFilter : '')
  const students = data?.data
  const total = data?.total ?? 0
  const deleteMutation = useDeleteStudent()

  const classStudentIds = useMemo(
    () => new Set(classDetail?.students?.map((s) => s.id) ?? []),
    [classDetail],
  )

  const filtered = useMemo(() => {
    const base = students ?? []
    const withClass = classFilter === 'all'
      ? base
      : base.filter((s) => classStudentIds.has(s.id))
    return withClass.filter((s) => {
      if (!dateFrom && !dateTo) return true
      if (!s.enrollmentDate) return false
      const d = s.enrollmentDate.slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
      return true
    })
  }, [students, classFilter, classStudentIds, dateFrom, dateTo])

  const columns = useMemo<Column<Student>[]>(() =>
    columnsBase.map((col) => {
      if (col.key !== 'enrollmentStatus') return col
      return {
        ...col,
        filter: {
          options: [
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' },
            { value: 'transferred', label: 'Transferido' },
            { value: 'cancelled', label: 'Cancelado' },
          ],
          value: statusFilter === 'all' ? null : statusFilter,
          onFilterChange: (v) => {
            setPage(1)
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              if (!v || v === 'all') next.delete('status')
              else next.set('status', v)
              return next
            })
          },
        },
      }
    }),
  [statusFilter, setSearchParams])

  const deleteApiMutation = useApiMutation({
    mutationFn: (id: string) => deleteMutation.mutateAsync(id),
    successMessage: 'Aluno removido',
    onSuccess: () => setDeleteTarget(null),
    onError: () => setDeleteTarget(null),
  })

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  function calcAge(birthDate: string | null): number | null {
    if (!birthDate) return null
    const birth = new Date(birthDate + 'T12:00:00')
    if (isNaN(birth.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  function handleSortChange(column: string, direction: 'asc' | 'desc' | null) {
    setSortColumn(direction ? column : null)
    setSortDirection(direction)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Alunos"
        subtitle={
          statusFilter === 'all' && classFilter === 'all' && !dateFrom && !dateTo
            ? `${total} aluno${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`
            : `${filtered.length} aluno${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`
        }
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/students/import')}>
              <Upload className="h-4 w-4 mr-1" />
              Importar
            </Button>
            <Button size="sm" onClick={() => navigate('/students/new')}>
              <Plus className="h-4 w-4 mr-1" />
              Novo aluno
            </Button>
          </div>
        }
      />

      <div className="flex gap-3 flex-wrap items-end">
        <div className="w-full max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => { setPage(1); setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v) next.delete('q'); else next.set('q', v); return next }) }}
            placeholder="Buscar por nome ou matrícula…"
            name="student-search"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="sm:hidden"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          Filtros
          {filtersOpen && <X className="h-4 w-4" />}
        </Button>
        <div className={cn('w-full sm:w-auto flex gap-3 flex-wrap items-end', !filtersOpen && 'hidden sm:flex')}>
          <Select value={sexFilter} onValueChange={(v) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v || v === 'all') next.delete('sex'); else next.set('sex', v); return next }) }}>
            <SelectTrigger aria-label="Filtrar por sexo" className="w-[130px]">
              <SelectValue placeholder="Sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={(v) => { setPage(1); setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v || v === 'all') next.delete('classId'); else next.set('classId', v); return next }) }}>
            <SelectTrigger aria-label="Filtrar por turma" className="w-[180px]">
              <SelectValue placeholder="Turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as turmas</SelectItem>
              {(classes ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            aria-label="Matrícula de"
            title="Matrícula de"
            value={dateFrom}
            onChange={(e) => setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value) next.delete('dateFrom'); else next.set('dateFrom', e.target.value); return next })}
            className="h-9 w-[140px] text-xs"
          />
          <Input
            type="date"
            aria-label="Matrícula até"
            title="Matrícula até"
            value={dateTo}
            onChange={(e) => setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value) next.delete('dateTo'); else next.set('dateTo', e.target.value); return next })}
            className="h-9 w-[140px] text-xs"
          />
          <input
            type="number"
            min={0}
            max={120}
            placeholder="Idade min"
            value={minAge}
            onChange={(e) => setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value) next.delete('minAge'); else next.set('minAge', e.target.value); return next })}
            className="h-9 w-24 px-2.5 text-xs rounded-md border outline-hidden"
            style={{ border: '1px solid hsl(var(--input))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
          />
          <input
            type="number"
            min={0}
            max={120}
            placeholder="Idade max"
            value={maxAge}
            onChange={(e) => setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value) next.delete('maxAge'); else next.set('maxAge', e.target.value); return next })}
            className="h-9 w-24 px-2.5 text-xs rounded-md border outline-hidden"
            style={{ border: '1px solid hsl(var(--input))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        onRowClick={(s) => navigate(`/students/${s.id}`)}
        actions={(s) => (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              title="Editar"
              aria-label="Editar"
              onClick={() => navigate(`/students/${s.id}`)}
            >
              <Pencil size={14} className="text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              title="Excluir"
              aria-label="Excluir"
              onClick={() => setDeleteTarget(s.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
        emptyMessage={search ? `Nenhum aluno encontrado para "${search}".` : 'Nenhum aluno cadastrado.'}
        emptyIcon={UserPlus}
        caption="Lista de alunos"
        loading={isLoading}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
        }}
        sort={{
          column: sortColumn,
          direction: sortDirection,
          onSortChange: handleSortChange,
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => {
          deleteApiMutation.mutate(deleteTarget!)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
