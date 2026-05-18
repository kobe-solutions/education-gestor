import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search } from 'lucide-react'
import { Link } from 'react-router'
import type { AxiosError } from 'axios'
import { useTuitions, useCreateTuition, useRegisterPayment } from '../hooks/useFinancial'
import { useStudents } from '../../students/hooks/useStudents'
import { TuitionStatusBadge } from '../components/TuitionStatusBadge'
import { toast } from '../../../lib/toast'
import { PageHead } from '../../../components/PageHead'
import { Surface } from '../../../components/Surface'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Skeleton } from '../../../components/ui/skeleton'
import type { Tuition } from '@education-gestor/types'

const tuitionSchema = z.object({
  studentId: z.string().min(1, 'Selecione o aluno'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

type TuitionForm = z.infer<typeof tuitionSchema>

function fmtBRL(v: string | number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function TuitionsPage() {
  const { data: tuitions, isLoading } = useTuitions()
  const { data: students } = useStudents()
  const createMutation = useCreateTuition()
  const payMutation = useRegisterPayment()
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
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Mensalidade criada')
        setDialogOpen(false)
        reset()
      },
      onError: (err) => {
        toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado')
      },
    })
  }

  function handlePay(tuition: Tuition) {
    payMutation.mutate(tuition.id, {
      onSuccess: () => {
        toast.success('Pagamento registrado')
        setConfirmPay(null)
      },
      onError: (err) => {
        toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Erro inesperado')
        setConfirmPay(null)
      },
    })
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
        <div className="relative" style={{ width: 280 }}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            size={14}
            style={{ color: 'var(--iris-slate-500)' }}
          />
          <input
            type="text"
            placeholder="Buscar aluno…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-shadow"
            style={{
              border: '1px solid var(--iris-slate-300)',
              background: '#fff',
              color: 'var(--iris-blue-900)',
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.boxShadow = 'var(--shadow-focus)' }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.boxShadow = 'none' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg outline-none"
          style={{
            border: '1px solid var(--iris-slate-300)',
            background: '#fff',
            color: 'var(--iris-blue-900)',
            width: 160,
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
          <table className="tbl w-full">
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
                    style={{ color: 'var(--iris-slate-500)', fontSize: 13 }}
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
                          style={{ color: 'var(--iris-blue-900)' }}
                        >
                          {student?.name ?? t.studentId}
                        </Link>
                      </td>
                      <td>{new Date(t.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
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
        </Surface>
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
              {errors.studentId && <p className="text-xs" style={{ color: 'var(--iris-danger-600)' }}>{errors.studentId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" placeholder="500.00" {...register('amount')} />
              {errors.amount && <p className="text-xs" style={{ color: 'var(--iris-danger-600)' }}>{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <Input type="date" {...register('dueDate')} />
              {errors.dueDate && <p className="text-xs" style={{ color: 'var(--iris-danger-600)' }}>{errors.dueDate.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: confirmar pagamento */}
      <Dialog open={!!confirmPay} onOpenChange={(v) => !v && setConfirmPay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar pagamento</DialogTitle></DialogHeader>
          <p className="text-sm" style={{ color: 'var(--iris-slate-500)' }}>
            Registrar pagamento de{' '}
            <strong style={{ color: 'var(--iris-blue-900)' }}>
              {confirmPay ? fmtBRL(confirmPay.amount) : ''}
            </strong>?{' '}
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPay(null)}>Cancelar</Button>
            <Button onClick={() => confirmPay && handlePay(confirmPay)} disabled={payMutation.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
