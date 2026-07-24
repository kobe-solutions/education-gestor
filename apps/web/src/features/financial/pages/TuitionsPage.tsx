import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { useTuitions, useCreateTuition, useRegisterPayment } from '../hooks/useFinancial'
import { useStudents } from '../../students/hooks/useStudents'
import { TuitionStatusBadge } from '../components/TuitionStatusBadge'
import { fmtBRL, formatDateBR } from '../../../lib/format'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { SearchInput } from '../../../components/SearchInput'
import { Skeleton } from '../../../components/ui/skeleton'
import type { Tuition } from '@education-gestor/types'

const tuitionSchema = z.object({
  studentId: z.string().min(1, 'Selecione o aluno'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

type TuitionForm = z.infer<typeof tuitionSchema>

const PAGE_SIZE = 15

export function TuitionsPage() {
  const [page, setPage] = useState(1)
  const { data: tuitionsData, isLoading } = useTuitions({ page, limit: PAGE_SIZE })
  const tuitions = tuitionsData?.data
  const total = tuitionsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const { data: studentsData } = useStudents()
  const students = studentsData?.data
  const createMutation = useCreateTuition()
  const payMutation = useRegisterPayment()

  const createApiMutation = useApiMutation({
    mutationFn: (data: TuitionForm) => createMutation.mutateAsync(data),
    successMessage: 'Mensalidade criada',
    onSuccess: () => { setDialogOpen(false); reset() },
  })

  const payApiMutation = useApiMutation({
    mutationFn: (id: string) => payMutation.mutateAsync(id),
    successMessage: 'Pagamento registrado',
    onSuccess: () => setConfirmPay(null),
    onError: () => setConfirmPay(null),
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmPay, setConfirmPay] = useState<Tuition | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TuitionForm>({
    resolver: zodResolver(tuitionSchema),
  })

  const studentIdValue = watch('studentId')

  const filtered = tuitions?.filter((t) => {
    const student = students?.find((s) => s.id === t.studentId)
    const matchesSearch = !search || student?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  }) ?? []

  function onSubmit(data: TuitionForm) {
    createApiMutation.mutate(data)
  }

  function handlePay(tuition: Tuition) {
    payApiMutation.mutate(tuition.id)
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Mensalidades"
        subtitle={`${filtered.length} cobranças encontradas`}
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova mensalidade
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="w-full max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar aluno…"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-md outline-hidden"
          style={{
            border: '1px solid hsl(var(--muted-foreground) / 0.3)',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--primary))',
          }}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Atrasado</option>
        </select>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <Surface>
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </Surface>
      ) : (
        <Surface>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th style={{ width: 160 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-10"
                      style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13 }}
                    >
                      Nenhuma mensalidade encontrada
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => {
                    const student = students?.find((s) => s.id === t.studentId)
                    return (
                      <tr key={t.id}>
                        <td>
                          <Link
                            to={`/students/${t.studentId}`}
                            className="font-semibold hover:underline"
                            style={{ color: 'hsl(var(--primary))' }}
                          >
                            {student?.name ?? t.studentId}
                          </Link>
                        </td>
                        <td>{formatDateBR(t.dueDate)}</td>
                        <td className="tabular-nums">{fmtBRL(t.amount)}</td>
                        <td><TuitionStatusBadge status={t.status} /></td>
                        <td>
                          {t.status !== 'paid' && (
                            <Button size="sm" variant="outline" onClick={() => setConfirmPay(t)}>
                              Registrar pagamento
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--iris-slate-500)' }}>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog: nova mensalidade */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova mensalidade</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Aluno</Label>
              <Select value={studentIdValue} onValueChange={(v) => setValue('studentId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                <SelectContent>
                  {students?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.studentId && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.studentId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" placeholder="500.00" {...register('amount')} />
              {errors.amount && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <Input type="date" {...register('dueDate')} />
              {errors.dueDate && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.dueDate.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createApiMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: confirmar pagamento */}
      <Dialog open={!!confirmPay} onOpenChange={(v) => !v && setConfirmPay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar pagamento</DialogTitle></DialogHeader>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Registrar pagamento de{' '}
            <strong style={{ color: 'hsl(var(--primary))' }}>
              {confirmPay ? fmtBRL(confirmPay.amount) : ''}
            </strong>?{' '}
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPay(null)}>Cancelar</Button>
            <Button onClick={() => confirmPay && handlePay(confirmPay)} disabled={payApiMutation.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
