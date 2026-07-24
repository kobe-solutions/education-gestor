import { Badge } from './ui/badge'
import {
  ENROLLMENT_STATUS_LABELS,
  enrollmentStatusVariant,
  EMPLOYMENT_STATUS_LABELS,
  TUITION_STATUS_LABELS,
  tuitionStatusVariant,
  ACADEMIC_YEAR_STATUS_LABELS,
  ACADEMIC_YEAR_STATUS_VARIANT,
} from '../lib/labels'

type StatusKind = 'enrollment' | 'employment' | 'tuition' | 'year' | 'active'

interface StatusBadgeProps {
  status: string
  kind: StatusKind
}

const KIND_CONFIG: Record<StatusKind, { labels: Record<string, string>; variant: (s: string) => string }> = {
  enrollment: { labels: ENROLLMENT_STATUS_LABELS, variant: enrollmentStatusVariant },
  employment: { labels: EMPLOYMENT_STATUS_LABELS, variant: () => 'outline' },
  tuition: { labels: TUITION_STATUS_LABELS, variant: tuitionStatusVariant },
  year: { labels: ACADEMIC_YEAR_STATUS_LABELS, variant: (s) => ACADEMIC_YEAR_STATUS_VARIANT[s] ?? 'outline' },
  active: { labels: { true: 'Ativo', false: 'Inativo' }, variant: (s) => s === 'true' ? 'success' : 'outline' },
}

export function StatusBadge({ status, kind }: StatusBadgeProps) {
  const config = KIND_CONFIG[kind]
  const label = config.labels[status] ?? status
  const variant = config.variant(status) as 'success' | 'warning' | 'danger' | 'outline' | 'info'

  return <Badge variant={variant}>{label}</Badge>
}
