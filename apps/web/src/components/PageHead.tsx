interface PageHeadProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHead({ title, subtitle, actions }: PageHeadProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      <div>
        <h1
          className="font-bold leading-tight"
          style={{ fontSize: 20, color: 'var(--iris-blue-900)', letterSpacing: '-0.01em' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm" style={{ color: 'var(--iris-slate-500)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
