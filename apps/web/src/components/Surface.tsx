interface SurfaceProps {
  children: React.ReactNode
  className?: string
}

export function Surface({ children, className }: SurfaceProps) {
  return (
    <div
      className={className}
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  )
}
