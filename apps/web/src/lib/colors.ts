export const SIDEBAR_BG = '#ffffff'
export const SIDEBAR_ITEM_HOVER = '#eaf4fd'
export const ACCENT_COLOR = '#185fa5'

export const TONE_CONFIG = {
  indigo: {
    iconBg: 'rgba(24, 95, 165, 0.10)',
    iconColor: '#185FA5',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(24, 95, 165, 0.16)',
  },
  violet: {
    iconBg: 'rgba(55, 138, 221, 0.10)',
    iconColor: '#378ADD',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(55, 138, 221, 0.16)',
  },
  slate: {
    iconBg: 'rgba(55, 87, 115, 0.08)',
    iconColor: '#526b81',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(55, 87, 115, 0.14)',
  },
  amber: {
    iconBg: 'rgba(180, 83, 9, 0.10)',
    iconColor: '#F59E0B',
    valueColor: '#F59E0B',
    borderColor: 'rgba(180, 83, 9, 0.15)',
  },
  emerald: {
    iconBg: 'rgba(21, 128, 61, 0.10)',
    iconColor: '#22C55E',
    valueColor: '#22C55E',
    borderColor: 'rgba(21, 128, 61, 0.15)',
  },
  red: {
    iconBg: 'rgba(185, 28, 28, 0.10)',
    iconColor: '#EF4444',
    valueColor: '#EF4444',
    borderColor: 'rgba(185, 28, 28, 0.15)',
  },
} as const

export type ToneKey = keyof typeof TONE_CONFIG

export const SHIFT_CONFIG: Record<string, { label: string; className: string }> = {
  manha:    { label: 'Manhã',    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  tarde:    { label: 'Tarde',    className: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30' },
  noite:    { label: 'Noite',    className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' },
  integral: { label: 'Integral', className: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30' },
}

export const LEVEL_COLORS: Record<string, string> = {
  fundamental: 'bg-blue-500',
  medio:       'bg-violet-500',
  tecnico:     'bg-teal-500',
  superior:    'bg-rose-500',
}
