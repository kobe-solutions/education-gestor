import { Outlet } from 'react-router'

export function PublicLayout() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(180deg, #EAF4FD 0%, #FFFFFF 60%)' }}
    >
      <Outlet />
    </div>
  )
}
