import { Outlet } from '@tanstack/react-router'
import { UpdateBanner } from '../components/data-safety/UpdateBanner'

/** Root layout — the app chrome. Hidden entirely under @media print (print.css). */
export function RootComponent() {
  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: '#f3f4f6', padding: '24px 0' }}>
      <UpdateBanner />
      <Outlet />
    </div>
  )
}
