import { useState, useRef } from 'react'
import { Plus, EyeOff, FileText, Receipt } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from '../../../lib/toast'
import { useTuitions, useRegisterPayment, useUploadTuitionBoleto, useUploadTuitionReceipt } from '../hooks/useFinancial'
import { TuitionCreateDialog } from '../components/TuitionCreateDialog'
import { TuitionStatusBadge } from '../components/TuitionStatusBadge'
import { fmtBRL, formatDateBR } from '../../../lib/format'
import { useApiMutation } from '../../../hooks/useApiMutation'
import { useFinancialVisibility } from '../../../contexts/FinancialVisibilityContext'
import { useFinancialBlocked } from '../../../lib/useFinancialBlocked'
import { PageHead } from '../../../components/PageHead'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog'
import { SearchInput } from '../../../components/SearchInput'
import { DataTable, type Column } from '../../../components/DataTable'
import type { Tuition } from '@education-gestor/types'

const PAGE_SIZE = 15

export function TuitionsPage() {
  const { hideFinancialData } = useFinancialVisibility()
  const { blocked: financialBlocked } = useFinancialBlocked()
  const [page, setPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>('dueDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc')
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') ?? 'all'
  const search = searchParams.get('q') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const { data: tuitionsData, isLoading } = useTuitions({ page, limit: PAGE_SIZE, status: statusFilter })
  const tuitions = tuitionsData?.data
  const total = tuitionsData?.total ?? 0
  const payMutation = useRegisterPayment()

  const payApiMutation = useApiMutation({
    mutationFn: (id: string) => payMutation.mutateAsync(id),
    successMessage: 'Pagamento registrado',
    onSuccess: () => setConfirmPay(null),
    onError: () => setConfirmPay(null),
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmPay, setConfirmPay] = useState<Tuition | null>(null)

  const filtered = tuitions?.filter((t) => {
    const matchesSearch = !search || (t as Tuition & { studentName?: string }).studentName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    const matchesDateFrom = !dateFrom || t.dueDate >= dateFrom
    const matchesDateTo = !dateTo || t.dueDate <= dateTo
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo
  }) ?? []

  function handleSortChange(column: string, direction: 'asc' | 'desc' | null) {
    setSortColumn(direction ? column : null)
    setSortDirection(direction)
    setPage(1)
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
          {t.studentName ?? t.studentId}
        </Link>
      ),
    },
    {
      key: 'dueDate',
      label: 'Vencimento',
      sortable: true,
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

      <div className="flex gap-3 flex-wrap items-end">
        <div className="w-full max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => { setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!v) next.delete('q'); else next.set('q', v); return next }) }}
            placeholder="Buscar aluno…"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value || e.target.value === 'all') next.delete('status'); else next.set('status', e.target.value); return next })
          }}
          name="status"
          aria-label="Filtrar por status"
          className="px-3 py-2.5 text-sm rounded-md outline-hidden cursor-pointer hover:border-primary"
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

        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>De</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setPage(1)
              setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value) next.delete('dateFrom'); else next.set('dateFrom', e.target.value); return next })
            }}
            className="h-9 w-40 text-xs"
            aria-label="Data inicial"
          />
          <label className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Até</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setPage(1)
              setSearchParams((prev) => { const next = new URLSearchParams(prev); if (!e.target.value) next.delete('dateTo'); else next.set('dateTo', e.target.value); return next })
            }}
            className="h-9 w-40 text-xs"
            aria-label="Data final"
          />
        </div>
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

      <TuitionCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />

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
