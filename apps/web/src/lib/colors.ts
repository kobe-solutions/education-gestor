export const SIDEBAR_BG = '#0a0f1a'
export const SIDEBAR_ITEM_HOVER = '#111827'
export const ACCENT_COLOR = '#818CF8'

export const TONE_CONFIG = {
  indigo: {
    iconBg: 'rgba(79, 70, 229, 0.12)',
    iconColor: '#818CF8',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(79, 70, 229, 0.15)',
  },
  violet: {
    iconBg: 'rgba(129, 140, 248, 0.12)',
    iconColor: '#A5B4FC',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(129, 140, 248, 0.15)',
  },
  slate: {
    iconBg: 'rgba(49, 46, 129, 0.10)',
    iconColor: '#818CF8',
    valueColor: 'hsl(var(--foreground))',
    borderColor: 'rgba(49, 46, 129, 0.12)',
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
  manha:    { label: 'Manhã',    className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  tarde:    { label: 'Tarde',    className: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  noite:    { label: 'Noite',    className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  integral: { label: 'Integral', className: 'bg-green-500/10 text-green-400 border-green-500/30' },
}

export const LEVEL_COLORS: Record<string, string> = {
  fundamental: 'bg-blue-500',
  medio:       'bg-violet-500',
  tecnico:     'bg-teal-500',
  superior:    'bg-rose-500',
}
