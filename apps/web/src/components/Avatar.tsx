import { cn } from '../lib/utils'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

export function Avatar({ name, size = 32, className }: AvatarProps) {
  return (
    <div
      className={cn('flex items-center justify-center shrink-0 rounded-full font-semibold', className)}
      style={{
        width: size,
        height: size,
        background: 'hsl(217 91% 95%)',
        color: 'hsl(217 91% 40%)',
        fontSize: size * 0.34,
      }}
    >
      {getInitials(name)}
    </div>
  )
}
