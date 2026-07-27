import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, ChevronLeft, ChevronRight, EyeOff, FileText, Receipt } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from '../../../lib/toast'
import { useTuitions, useCreateTuition, useRegisterPayment, useUploadTuitionBoleto, useUploadTuitionReceipt } from '../hooks/useFinancial'
import { useStudents } from '../../students/hooks/useStudents'
import { TuitionStatusBadge } from '../components/TuitionStatusBadge'
import { fmtBRL, formatDateBR } from '../../../lib/format'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { useFinancialVisibility } from '../../../contexts/FinancialVisibilityContext'
import { useFinancialBlocked } from '../../../lib/useFinancialBlocked'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { SearchInput } from '../../../components/SearchInput'
import { DataTable, type Column } from '../../../components/DataTable'
import type { Tuition } from '@education-gestor/types'

const tuitionSchema = z.object({
  studentId: z.string().min(1, 'Selecione o aluno'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

type TuitionForm = z.infer<typeof tuitionSchema>

const PAGE_SIZE = 15

export function TuitionsPage() {
  const { hideFinancialData } = useFinancialVisibility()
  const { blocked: financialBlocked } = useFinancialBlocked()
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
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'

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

  function getStudentName(studentId: string) {
    return students?.find((s) => s.id === studentId)?.name ?? studentId
  }

  function onSubmit(data: TuitionForm) {
    createApiMutation.mutate(data)
  }

  function handlePay(tuition: Tuition) {
    payApiMutation.mutate(tuition.id)
  }

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const uploadBoleto = useUploadTuitionBoleto()
  const uploadReceipt = useUploadTuitionReceipt()

  function handleBoletoUpload(tuitionId: string, file: File) {
    uploadBoleto.mutate({ id: tuitionId, file }, {
      onSuccess: () => toast.success('Boleto anexado'),
      onError: () => toast.error('Erro ao anexar boleto'),
    })
  }

  function handleReceiptUpload(tuitionId: string, file: File) {
    uploadReceipt.mutate({ id: tuitionId, file }, {
      onSuccess: () => toast.success('Comprovante anexado'),
      onError: () => toast.error('Erro ao anexar comprovante'),
    })
  }

  const columns: Column<Tuition & { studentName?: string }>[] = [
    {
      key: 'studentId',
      label: 'Aluno',
      render: (t) => (
        <Link
          to={`/students/${t.studentId}`}
          className="font-semibold hover:underline"
          style={{ color: 'hsl(var(--primary))' }}
          onClick={(e) => e.stopPropagation()}
        >
          {getStudentName(t.studentId)}
        </Link>
      ),
    },
    {
      key: 'dueDate',
      label: 'Vencimento',
      render: (t) => formatDateBR(t.dueDate),
    },
    {
      key: 'amount',
      label: 'Valor',
      render: (t) => <span className="tabular-nums">{fmtBRL(t.amount)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (t) => <TuitionStatusBadge status={t.status} />,
    },
  ]

  if (hideFinancialData || financialBlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 72, height: 72, background: 'hsl(var(--accent))' }}
        >
          <EyeOff size={32} className="text-muted-foreground" />
        </div>
        <div className="text-center max-w-sm">
          <p className="font-semibold text-lg" style={{ color: 'hsl(var(--foreground))' }}>
            Dados financeiros ocultos
          </p>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Ative a visualização de dados financeiros no menu lateral ou no cabeçalho para acessar as mensalidades.
          </p>
        </div>
      </div>
    )
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

      <div className="flex gap-3 flex-wrap">
        <div className="w-full max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v) next.delete('q'); else next.set('q', v); return next }) }}
            placeholder="Buscar aluno…"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value || e.target.value === 'all') next.delete('status'); else next.set('status', e.target.value); return next }) }}
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

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(t) => t.id}
        actions={(t) => (
          <div className="flex items-center gap-1">
            {t.status !== 'paid' && (
              <Button size="sm" variant="outline" onClick={() => setConfirmPay(t)}>
                Registrar pagamento
              </Button>
            )}
            <input
              ref={(el) => { fileInputRefs.current[`boleto-${t.id}`] = el }}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleBoletoUpload(t.id, file)
                e.target.value = ''
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              title="Anexar boleto"
              onClick={() => fileInputRefs.current[`boleto-${t.id}`]?.click()}
            >
              <FileText className="h-4 w-4" />
            </Button>
            {t.boletoUrl && (
              <Button size="sm" variant="ghost" title="Ver boleto" onClick={() => window.open(t.boletoUrl!, '_blank')}>
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {t.receiptUrl && (
              <Button size="sm" variant="ghost" title="Ver comprovante" onClick={() => window.open(t.receiptUrl!, '_blank')}>
                <Receipt className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        emptyMessage="Nenhuma mensalidade encontrada"
        caption="Lista de mensalidades"
        loading={isLoading}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              aria-label="Página anterior"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              aria-label="Próxima página"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova mensalidade</DialogTitle>
            <DialogDescription className="sr-only">Criar uma nova mensalidade para um aluno</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Aluno</Label>
              <Select value={studentIdValue} onValueChange={(v) => { if (v !== null) setValue('studentId', v) }}
                items={students?.map((s) => ({ value: s.id, label: s.name }))}>
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

      <Dialog open={!!confirmPay} onOpenChange={(v) => !v && setConfirmPay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pagamento</DialogTitle>
            <DialogDescription className="sr-only">Confirmar registro de pagamento de mensalidade</DialogDescription>
          </DialogHeader>
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
