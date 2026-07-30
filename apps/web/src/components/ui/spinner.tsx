import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 16, className }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin shrink-0', className)}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Carregando"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        fill="currentColor"
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
