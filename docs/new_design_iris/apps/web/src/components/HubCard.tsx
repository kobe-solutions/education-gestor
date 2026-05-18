import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from './ui/card'

interface HubCardProps {
  to: string
  icon: React.ElementType
  title: string
  description: string
}

export function HubCard({ to, icon: Icon, title, description }: HubCardProps) {
  return (
    <Link to={to} className="group">
      <Card className="h-full hover:border-primary transition-colors cursor-pointer">
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary font-medium">
            Acessar
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
