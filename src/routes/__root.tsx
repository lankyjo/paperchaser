import { Outlet } from '@tanstack/react-router'
import { UpdateBanner } from '../components/data-safety/UpdateBanner'

// Root layout: the app chrome around every page; printing hides it and shows only the printed pages.
export function RootComponent() {
  return (
    <div className="app-shell min-h-screen bg-background py-6 text-foreground has-[[data-fullscreen]]:py-0">
      <UpdateBanner />
      <Outlet />
    </div>
  )
}
