import { Outlet } from 'react-router'

export function PublicLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Outlet />
    </div>
  )
}
