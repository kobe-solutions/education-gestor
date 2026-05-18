interface SurfaceProps {
  children: React.ReactNode
  className?: string
}

export function Surface({ children, className }: SurfaceProps) {
  return (
    <div
      className={className}
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--iris-slate-200)',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  )
}
