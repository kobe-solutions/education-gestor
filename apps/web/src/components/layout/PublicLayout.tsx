import { Outlet } from 'react-router'

export function PublicLayout() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-6"
      style={{ background: 'hsl(var(--background))' }}
    >
      <Outlet />
    </div>
  )
}
