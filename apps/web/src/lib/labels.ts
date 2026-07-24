// ─── Enrollment Status (Students) ────────────────────────────────────────────

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  transferred: 'Transferido',
  cancelled: 'Cancelado',
}

export function enrollmentStatusVariant(status: string) {
  if (status === 'active') return 'success' as const
  if (status === 'transferred') return 'warning' as const
  return 'outline' as const
}

// ─── Employment Status (Teachers) ────────────────────────────────────────────

export const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  licenca: 'Licença',
}

// ─── Contract Type (Teachers) ────────────────────────────────────────────────

export const CONTRACT_LABELS: Record<string, string> = {
  clt: 'CLT',
  temporario: 'Temporário',
  horista: 'Horista',
}

// ─── Shift / Turno ──────────────────────────────────────────────────────────

export const SHIFT_LABELS: Record<string, string> = {
  matutino: 'Matutino',
  vespertino: 'Vespertino',
  noturno: 'Noturno',
  integral: 'Integral',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

export const SHIFT_BADGE_CLASSES: Record<string, string> = {
  manha: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  tarde: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  noite: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  integral: 'bg-green-500/10 text-green-400 border-green-500/30',
  matutino: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  vespertino: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  noturno: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
}

// ─── Academic Year Status ───────────────────────────────────────────────────

export const ACADEMIC_YEAR_STATUS_LABELS: Record<string, string> = {
  planning: 'Planejamento',
  active: 'Ativo',
  closed: 'Encerrado',
}

export const ACADEMIC_YEAR_STATUS_VARIANT: Record<string, 'warning' | 'success' | 'outline'> = {
  planning: 'warning',
  active: 'success',
  closed: 'outline',
}

// ─── Period Type ────────────────────────────────────────────────────────────

export const PERIOD_TYPE_LABELS: Record<string, string> = {
  bimestre: 'Bimestre',
  trimestre: 'Trimestre',
  semestre: 'Semestre',
}

// ─── Tuition Status ─────────────────────────────────────────────────────────

export const TUITION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
}

export function tuitionStatusVariant(status: string) {
  if (status === 'paid') return 'success' as const
  if (status === 'overdue') return 'danger' as const
  return 'warning' as const
}

// ─── Active / Inactive ──────────────────────────────────────────────────────

export const ACTIVE_LABELS: Record<string, string> = {
  true: 'Ativo',
  false: 'Inativo',
}

// ─── Document Type ──────────────────────────────────────────────────────────

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  historico: 'Histórico Escolar',
  boletim: 'Boletim de Notas',
  identidade: 'Documento de Identidade',
  outros: 'Outros',
}
