import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground border-border',
        success: 'border-transparent',
        warning: 'border-transparent',
        danger:  'border-transparent',
        info:    'border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const variantStyles: Record<string, React.CSSProperties> = {
  success: { color: 'var(--iris-success-600)', background: 'var(--iris-success-50)' },
  warning: { color: 'var(--iris-warning-600)', background: 'var(--iris-warning-50)' },
  danger:  { color: 'var(--iris-danger-600)', background: 'var(--iris-danger-50)' },
  info:    { color: 'var(--iris-info-600)', background: 'var(--iris-info-50)' },
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={variant ? variantStyles[variant] : undefined}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
