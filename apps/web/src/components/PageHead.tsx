import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from './ui/button'

interface PageHeadProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  backTo?: string | (() => void)
}

export function PageHead({ title, subtitle, actions, backTo }: PageHeadProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (!backTo) return
    if (typeof backTo === 'function') {
      backTo()
    } else {
      navigate(backTo)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      <div className="flex items-start gap-2">
        {backTo && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="mt-0.5 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 20, color: 'hsl(var(--primary))', letterSpacing: '-0.01em' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
