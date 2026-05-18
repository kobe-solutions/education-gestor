import { Badge } from '../../../components/ui/badge'

interface Props {
  status: 'pending' | 'paid' | 'overdue'
}

const labels: Record<Props['status'], string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
}

export function TuitionStatusBadge({ status }: Props) {
  const variant = status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : 'warning'
  return <Badge variant={variant}>{labels[status]}</Badge>
}
