import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from './ui/button'

interface PageHeadProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  backTo?: string | (() => void)
  breadcrumb?: React.ReactNode
  tabs?: React.ReactNode
}

export function PageHead({ title, subtitle, actions, backTo, breadcrumb, tabs }: PageHeadProps) {
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
    <div className="space-y-3">
      {breadcrumb}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-2">
          {backTo && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Voltar"
              onClick={handleBack}
              className="mt-0.5 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-primary">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {tabs && tabs}
    </div>
  )
}
