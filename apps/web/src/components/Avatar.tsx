import { useState } from 'react'
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
  photoUrl?: string | null
}

export function Avatar({ name, size = 32, className, photoUrl }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  if (photoUrl && !imgError) {
    return (
      <div
        className={cn('shrink-0 rounded-full overflow-hidden', className)}
        style={{ height: size, width: size }}
      >
        <img
          src={photoUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover p-2"
        />
      </div>
    )
  }

  return (
    <div
      className={cn('flex items-center justify-center shrink-0 rounded-full font-semibold', className)}
      style={{
        height: size,
        width: size,
        background: 'hsl(var(--primary) / 0.1)',
        color: 'hsl(var(--primary))',
        fontSize: size * 0.34,
      }}
    >
      {getInitials(name)}
    </div>
  )
}
